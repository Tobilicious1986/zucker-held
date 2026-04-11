# ═══════════════════════════════════════════════════════════
# Multi-Stage Build: Maven Build → Minimale JRE Runtime
# ═══════════════════════════════════════════════════════════

# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Dependencies zuerst cachen (besseres Layer-Caching)
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    mvn dependency:go-offline -B 2>/dev/null || true

# Quellcode kopieren und bauen
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn clean package -DskipTests -B

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Nicht-Root-User für Sicherheit
RUN addgroup -S zuckerheld && adduser -S zuckerheld -G zuckerheld
USER zuckerheld

# JAR kopieren
COPY --from=builder /app/target/*.jar app.jar

# Health-Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:${PORT:-8080}/actuator/health || exit 1

# Port
EXPOSE 8080

# JVM-Optimierungen für Container
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-default}", \
    "-jar", "app.jar"]
