package com.kalaabr.service;

import com.kalaabr.dto.AuthResponse;
import com.kalaabr.dto.LoginRequest;
import com.kalaabr.dto.RegisterRequest;
import com.kalaabr.dto.UserMapper;
import com.kalaabr.entity.Role;
import com.kalaabr.entity.User;
import com.kalaabr.exception.DuplicateResourceException;
import com.kalaabr.repository.UserRepository;
import com.kalaabr.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException("نام کاربری «%s» از قبل وجود دارد".formatted(request.username()));
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("ایمیلی با آدرس «%s» از قبل ثبت شده است".formatted(request.email()));
        }

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER);
        user = userRepository.save(user);

        return toAuthResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // ورود با نام کاربری (ترجیحی) یا ایمیل — username ابتدا جستجو می‌شود.
        User user = userRepository.findByUsername(request.username())
                .or(() -> userRepository.findByEmail(request.email()))
                .orElseThrow(() -> new BadCredentialsException("نام کاربری، ایمیل یا رمز عبور نادرست است"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("نام کاربری، ایمیل یا رمز عبور نادرست است");
        }
        return toAuthResponse(user);
    }

    private AuthResponse toAuthResponse(User user) {
        return new AuthResponse(jwtService.generateToken(user), UserMapper.toResponse(user));
    }
}
