package de.zuckerheld.infrastructure.security;

import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final ProfileRepository profileRepository;

    public JwtAuthFilter(JwtService jwtService, ProfileRepository profileRepository) {
        this.jwtService = jwtService;
        this.profileRepository = profileRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token) || jwtService.isRefreshToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        final String profileId = jwtService.extractProfileId(token);
        final String role      = jwtService.extractRole(token);

        if (profileId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            profileRepository.findById(profileId).ifPresent(profile -> {
                // Rolle aus Token verwenden (kann elevated sein)
                String effectiveRole = (role != null) ? role.toUpperCase() : profile.getRole().name();

                var auth = new UsernamePasswordAuthenticationToken(
                        profile,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + effectiveRole))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        }

        filterChain.doFilter(request, response);
    }
}
