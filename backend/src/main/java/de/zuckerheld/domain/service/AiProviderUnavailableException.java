package de.zuckerheld.domain.service;

public class AiProviderUnavailableException extends RuntimeException {

    private final String provider;
    private final String userMessage;

    public AiProviderUnavailableException(String provider, String userMessage) {
        super(userMessage);
        this.provider = provider;
        this.userMessage = userMessage;
    }

    public String getProvider() {
        return provider;
    }

    public String getUserMessage() {
        return userMessage;
    }
}
