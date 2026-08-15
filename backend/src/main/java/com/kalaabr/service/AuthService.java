package com.kalaabr.service;

import com.kalaabr.dto.AuthResponse;
import com.kalaabr.dto.LoginRequest;
import com.kalaabr.dto.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
