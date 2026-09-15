using FitSync_API.Data;
using FitSync_API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace FitSync_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly FitSyncDbContext _context;
        private readonly PasswordHasher<User> _passwordHasher;

        public AccountController(FitSyncDbContext context)
        {
            _context = context;
            _passwordHasher = new PasswordHasher<User>();
        }

        // ============================
        // SHARED PHONE NUMBER VALIDATION
        // ============================
        // Used by Register, Login-adjacent flows, Reset Password and
        // Check Phone so every endpoint enforces the same rule:
        //   - required
        //   - exactly 10 digits
        //   - not a placeholder like "0000000000" or any other
        //     10-digit string made of a single repeated digit
        //   - must not start with 0 (no real mobile number does)
        private static bool IsValidPhoneNumber(string? phoneNumber, out string errorMessage)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber))
            {
                errorMessage = "Phone number is required.";
                return false;
            }

            var trimmed = phoneNumber.Trim();
            if (trimmed.StartsWith("+91", StringComparison.Ordinal))
            {
                trimmed = trimmed[3..];
            }

            if (!Regex.IsMatch(trimmed, @"^\d{10}$"))
            {
                errorMessage = "Phone number must contain exactly 10 digits.";
                return false;
            }

            if (trimmed[0] == '0')
            {
                errorMessage = "Please enter a valid mobile number.";
                return false;
            }

            // Reject "0000000000", "1111111111", "9999999999", etc.
            if (Regex.IsMatch(trimmed, @"^(\d)\1{9}$"))
            {
                errorMessage = "Please enter a valid mobile number.";
                return false;
            }

            errorMessage = string.Empty;
            return true;
        }


        // ============================
        // REGISTER
        // ============================
        [HttpPost("register")]
        public async Task<IActionResult> Register(UserRegisterRequest request)
        {
            // Validate Full Name
            if (string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequest(new
                {
                    message = "Full name is required."
                });
            }

            // Validate Email
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new
                {
                    message = "Email is required."
                });
            }

            // Validate Email Format
            if (!Regex.IsMatch(
                    request.Email.Trim(),
                    @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            {
                return BadRequest(new
                {
                    message = "Please enter a valid email address."
                });
            }

            // Validate Phone Number
            if (string.IsNullOrWhiteSpace(request.PhoneNumber))
            {
                return BadRequest(new
                {
                    message = "Phone number is required."
                });
            }

            // Phone number must be exactly 10 digits, and not a
            // fake/placeholder number (e.g. all zeros, all same digit)
            if (!IsValidPhoneNumber(request.PhoneNumber, out var phoneError))
            {
                return BadRequest(new
                {
                    message = phoneError
                });
            }

            // Validate Password
            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    message = "Password is required."
                });
            }

            // Password minimum length
            if (request.Password.Length < 8)
            {
                return BadRequest(new
                {
                    message = "Password must contain at least 8 characters."
                });
            }

            // Password must contain uppercase letter
            if (!Regex.IsMatch(request.Password, @"[A-Z]"))
            {
                return BadRequest(new
                {
                    message = "Password must contain at least one uppercase letter."
                });
            }

            // Password must contain lowercase letter
            if (!Regex.IsMatch(request.Password, @"[a-z]"))
            {
                return BadRequest(new
                {
                    message = "Password must contain at least one lowercase letter."
                });
            }

            // Password must contain number
            if (!Regex.IsMatch(request.Password, @"\d"))
            {
                return BadRequest(new
                {
                    message = "Password must contain at least one number."
                });
            }

            // Password must contain special character
            if (!Regex.IsMatch(
                    request.Password,
                    @"[^a-zA-Z0-9]"))
            {
                return BadRequest(new
                {
                    message = "Password must contain at least one special character."
                });
            }

            // Confirm password
            if (string.IsNullOrWhiteSpace(request.ConfirmPassword))
            {
                return BadRequest(new
                {
                    message = "Please confirm your password."
                });
            }

            if (request.Password != request.ConfirmPassword)
            {
                return BadRequest(new
                {
                    message = "Passwords do not match."
                });
            }

            // Clean email
            var email = request.Email.Trim().ToLower();

            // Clean phone number
            var phoneNumber = request.PhoneNumber.Trim();
            if (phoneNumber.StartsWith("+91", StringComparison.Ordinal))
            {
                phoneNumber = phoneNumber[3..];
            }

            // Check whether email already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == email);

            if (existingUser != null)
            {
                return Conflict(new
                {
                    message = "An account with this email already exists."
                });
            }

            // Check whether phone number already exists
            var existingPhone = await _context.Users
                .FirstOrDefaultAsync(x => x.PhoneNumber == phoneNumber);

            if (existingPhone != null)
            {
                return Conflict(new
                {
                    message = "An account with this phone number already exists."
                });
            }

            // Create new user
            var user = new User
            {
                FullName = request.FullName.Trim(),
                Email = email,
                PhoneNumber = phoneNumber,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            // Hash password
            user.PasswordHash =
                _passwordHasher.HashPassword(
                    user,
                    request.Password
                );

            // Add user to database
            _context.Users.Add(user);

            // Save changes
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Registration successful."
            });
        }


        // ============================
        // LOGIN
        // ============================
        [HttpPost("login")]
        public async Task<IActionResult> Login(UserLoginRequest request)
        {
            // Validate Email
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new
                {
                    message = "Email is required."
                });
            }

            // Validate Password
            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    message = "Password is required."
                });
            }

            // Clean email
            var email = request.Email.Trim().ToLower();

            // Find user
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == email);

            // User not found
            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            // Verify password
            var passwordResult =
                _passwordHasher.VerifyHashedPassword(
                    user,
                    user.PasswordHash,
                    request.Password
                );

            // Password incorrect
            if (passwordResult == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            // Account was created through testing
            if (!user.IsActive)
            {
                return Unauthorized(new
                {
                    message = "This account is inactive. Please register through the FitSync website."
                });
            }

            // Login successful
            return Ok(new
            {
                message = "Login successful.",

                user = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.PhoneNumber,
                    user.Role
                }
            });
        }


        // ============================
        // GOOGLE LOGIN / SIGN-UP
        // Called by wwwroot/js/auth.js (both the real Google Identity
        // Services flow and the simulated fallback used when no Google
        // Client ID is configured). Creates the account on first sign-in,
        // logs the user in on every sign-in after that.
        // ============================
        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new { message = "Google account email is required." });
            }

            var email = request.Email.Trim().ToLower();

            var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == email);

            if (user == null)
            {
                // First time signing in with this Google account - create it.
                // PhoneNumber is unique in the schema, so give every Google
                // account a distinct placeholder instead of leaving it null
                // (a second null could collide on some database providers).
                user = new User
                {
                    FullName = string.IsNullOrWhiteSpace(request.Name) ? "FitSync Member" : request.Name.Trim(),
                    Email = email,
                    PhoneNumber = "google-" + Guid.NewGuid().ToString("N").Substring(0, 10),
                    IsActive = true,
                    Role = "User",
                    CreatedAt = DateTime.UtcNow
                };
                // Google-authenticated accounts don't use a FitSync password,
                // but PasswordHash is required (NOT NULL) - store a random,
                // unguessable value so a normal email/password login can
                // never succeed against this account.
                user.PasswordHash = _passwordHasher.HashPassword(user, Guid.NewGuid().ToString());

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            if (!user.IsActive)
            {
                return Unauthorized(new { message = "This account is inactive." });
            }

            return Ok(new
            {
                message = "Google sign-in successful.",
                user = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.PhoneNumber,
                    user.Role
                }
            });
        }


        // ============================
        // CHECK PHONE (used by Forgot Password flow)
        // ============================
        [HttpPost("check-phone")]
        public async Task<IActionResult> CheckPhone(
            CheckPhoneRequest request)
        {
            if (!IsValidPhoneNumber(request.PhoneNumber, out var phoneError))
            {
                return BadRequest(new
                {
                    exists = false,
                    message = phoneError
                });
            }

            var phoneNumber = request.PhoneNumber.Trim();
            if (phoneNumber.StartsWith("+91", StringComparison.Ordinal))
            {
                phoneNumber = phoneNumber[3..];
            }

            var exists = await _context.Users
                .AnyAsync(x => x.PhoneNumber == phoneNumber);

            if (!exists)
            {
                return NotFound(new
                {
                    exists = false,
                    message = "No FitSync account found with this mobile number."
                });
            }

            return Ok(new
            {
                exists = true
            });
        }


        // ============================
        // RESET PASSWORD
        // ============================
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(
            ResetPasswordRequest request)
        {
            // Validate phone number
            if (string.IsNullOrWhiteSpace(request.PhoneNumber))
            {
                return BadRequest(new
                {
                    message = "Phone number is required."
                });
            }

            // Phone number must be exactly 10 digits, and not a
            // fake/placeholder number (e.g. all zeros, all same digit)
            if (!IsValidPhoneNumber(request.PhoneNumber, out var resetPhoneError))
            {
                return BadRequest(new
                {
                    message = resetPhoneError
                });
            }

            // Validate new password
            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new
                {
                    message = "New password is required."
                });
            }

            // Password minimum length
            if (request.NewPassword.Length < 8)
            {
                return BadRequest(new
                {
                    message = "Password must contain at least 8 characters."
                });
            }

            // Password must contain uppercase
            if (!Regex.IsMatch(request.NewPassword, @"[A-Z]"))
            {
                return BadRequest(new
                {
                    message = "Password must contain at least one uppercase letter."
                });
            }

            // Password must contain lowercase
            if (!Regex.IsMatch(request.NewPassword, @"[a-z]"))
            {
                return BadRequest(new
                {
                    message = "Password must contain at least one lowercase letter."
                });
            }

            // Password must contain number
            if (!Regex.IsMatch(request.NewPassword, @"\d"))
            {
                return BadRequest(new
                {
                    message = "Password must contain at least one number."
                });
            }

            // Password must contain special character
            if (!Regex.IsMatch(
                    request.NewPassword,
                    @"[^a-zA-Z0-9]"))
            {
                return BadRequest(new
                {
                    message = "Password must contain at least one special character."
                });
            }

            // Confirm password
            if (string.IsNullOrWhiteSpace(request.ConfirmPassword))
            {
                return BadRequest(new
                {
                    message = "Please confirm your password."
                });
            }

            if (request.NewPassword != request.ConfirmPassword)
            {
                return BadRequest(new
                {
                    message = "Passwords do not match."
                });
            }

            // Clean phone number
            var phoneNumber = request.PhoneNumber.Trim();
            if (phoneNumber.StartsWith("+91", StringComparison.Ordinal))
            {
                phoneNumber = phoneNumber[3..];
            }

            // Find user by registered phone number
            var user = await _context.Users
                .FirstOrDefaultAsync(
                    x => x.PhoneNumber == phoneNumber);

            // Phone number does not exist
            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "Mobile number is not registered."
                });
            }

            // Create new password hash
            user.PasswordHash =
                _passwordHasher.HashPassword(
                    user,
                    request.NewPassword
                );

            // Save new password hash
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Password reset successfully."
            });
        }

        // ============================
        // GET USER PROFILE
        // ============================
        [HttpGet("profile/{id}")]
        public async Task<IActionResult> GetProfile(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.PhoneNumber,
                user.Age,
                user.Gender,
                user.HeightCm,
                user.WeightKg,
                user.FitnessGoal,
                user.FitnessLevel,
                user.DietPreference,
                user.PreferredWorkout,
                user.ProfileImage,
                user.Role,
                user.HasUsedTrial,
                user.CreatedAt
            });
        }

        // ============================
        // UPDATE USER PROFILE (WITH USER ISOLATION 403)
        // ============================
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            // Strict User Isolation (Section 17: User A cannot modify User B's profile)
            if (Request.Headers.TryGetValue("x-user-id", out var headerVal) && int.TryParse(headerVal, out var authUserId))
            {
                if (authUserId != request.UserId)
                {
                    return StatusCode(403, new { message = "Forbidden: User A cannot modify User B's profile." });
                }
            }

            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            if (!string.IsNullOrWhiteSpace(request.FullName)) user.FullName = request.FullName.Trim();
            if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
            {
                var normalizedPhone = request.PhoneNumber.Trim();
                if (normalizedPhone.StartsWith("+91", StringComparison.Ordinal)) normalizedPhone = normalizedPhone[3..];
                user.PhoneNumber = normalizedPhone;
            }
            if (request.Age.HasValue) user.Age = request.Age.Value;
            if (!string.IsNullOrWhiteSpace(request.Gender)) user.Gender = request.Gender;
            if (request.HeightCm.HasValue) user.HeightCm = request.HeightCm.Value;
            if (request.WeightKg.HasValue) user.WeightKg = request.WeightKg.Value;
            if (!string.IsNullOrWhiteSpace(request.FitnessGoal)) user.FitnessGoal = request.FitnessGoal;
            if (!string.IsNullOrWhiteSpace(request.FitnessLevel)) user.FitnessLevel = request.FitnessLevel;
            if (!string.IsNullOrWhiteSpace(request.DietPreference)) user.DietPreference = request.DietPreference;
            if (!string.IsNullOrWhiteSpace(request.PreferredWorkout)) user.PreferredWorkout = request.PreferredWorkout;
            if (!string.IsNullOrWhiteSpace(request.ProfileImage)) user.ProfileImage = request.ProfileImage;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully.", user });
        }
    }

    public class UpdateProfileRequest
    {
        public int UserId { get; set; }
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public int? Age { get; set; }
        public string? Gender { get; set; }
        public decimal? HeightCm { get; set; }
        public decimal? WeightKg { get; set; }
        public string? FitnessGoal { get; set; }
        public string? FitnessLevel { get; set; }
        public string? DietPreference { get; set; }
        public string? PreferredWorkout { get; set; }
        public string? ProfileImage { get; set; }
    }


    // =====================================
    // REGISTER REQUEST MODEL
    // =====================================
    public class UserRegisterRequest
    {
        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        public string ConfirmPassword { get; set; } = string.Empty;
    }


    // =====================================
    // LOGIN REQUEST MODEL
    // =====================================
    public class UserLoginRequest
    {
        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
    }


    // =====================================
    // RESET PASSWORD REQUEST MODEL
    // =====================================
    public class ResetPasswordRequest
    {
        public string PhoneNumber { get; set; } = string.Empty;

        public string NewPassword { get; set; } = string.Empty;

        public string ConfirmPassword { get; set; } = string.Empty;
    }


    // =====================================
    // CHECK PHONE REQUEST MODEL
    // =====================================
    public class CheckPhoneRequest
    {
        public string PhoneNumber { get; set; } = string.Empty;
    }


    // =====================================
    // GOOGLE LOGIN REQUEST MODEL
    // =====================================
    public class GoogleLoginRequest
    {
        public string Email { get; set; } = string.Empty;

        public string? Name { get; set; }

        public string? GoogleId { get; set; }
    }
}