package de.zuckerheld.domain.service;

import de.zuckerheld.api.dto.InsightsDtos;
import de.zuckerheld.api.dto.ShareDtos;
import de.zuckerheld.domain.model.Entry;
import de.zuckerheld.domain.model.Profile;
import de.zuckerheld.domain.model.ShareLink;
import de.zuckerheld.infrastructure.repository.EntryRepository;
import de.zuckerheld.infrastructure.repository.ProfileRepository;
import de.zuckerheld.infrastructure.repository.ShareLinkRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class ShareLinkService {

    private static final SecureRandom RNG = new SecureRandom();
    private static final String TOKEN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz";

    private final ShareLinkRepository shareLinkRepository;
    private final ProfileRepository profileRepository;
    private final EntryRepository entryRepository;
    private final InsightsService insightsService;

    public ShareLinkService(ShareLinkRepository shareLinkRepository,
                            ProfileRepository profileRepository,
                            EntryRepository entryRepository,
                            InsightsService insightsService) {
        this.shareLinkRepository = shareLinkRepository;
        this.profileRepository = profileRepository;
        this.entryRepository = entryRepository;
        this.insightsService = insightsService;
    }

    @Transactional
    public ShareLink createLink(String ownerId, ShareLink.ShareMode mode, Integer ttlHours) {
        Profile owner = profileRepository.findById(ownerId)
                .orElseThrow(() -> new EntityNotFoundException("Profil nicht gefunden: " + ownerId));

        ShareLink link = new ShareLink();
        link.setOwner(owner);
        link.setMode(mode);
        link.setToken(generateUniqueToken());
        link.setExpiresAt(OffsetDateTime.now().plusHours(ttlHours != null ? Math.max(1, Math.min(ttlHours, 168)) : 24));
        return shareLinkRepository.save(link);
    }

    @Transactional(readOnly = true)
    public List<ShareLink> listLinks(String ownerId) {
        return shareLinkRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    @Transactional
    public void revokeLink(UUID id, String ownerId) {
        ShareLink link = shareLinkRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new EntityNotFoundException("Share-Link nicht gefunden."));
        link.setRevoked(true);
        shareLinkRepository.save(link);
    }

    @Transactional(readOnly = true)
    public ShareDtos.PublicShareResponse resolvePublicSnapshot(String token) {
        ShareLink link = shareLinkRepository.findByTokenAndRevokedFalse(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Link ungültig."));

        if (link.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Link ist abgelaufen.");
        }

        String ownerId = link.getOwner().getId();
        long to = System.currentTimeMillis();
        long from7d = to - (7L * 24 * 60 * 60 * 1000);
        List<Entry> entries = entryRepository.findByProfileAndTimeRange(ownerId, from7d, to);

        Entry lastBz = entries.stream()
                .filter(e -> e.getType() == Entry.EntryType.BZ && e.getBzValue() != null)
                .findFirst()
                .orElse(null);

        InsightsDtos.MetricsResponse metrics = insightsService.computeMetrics(ownerId, 7);
        InsightsDtos.PatternResponse patterns = insightsService.detectPatterns(ownerId, 14);

        List<ShareDtos.PublicEntry> visibleEntries = new ArrayList<>();
        int max = link.getMode() == ShareLink.ShareMode.DOCTOR ? 12 : 5;
        for (Entry entry : entries.stream().limit(max).toList()) {
            visibleEntries.add(new ShareDtos.PublicEntry(
                    entry.getTimestamp(),
                    entry.getType().toString(),
                    buildLabel(entry)
            ));
        }

        String emergencyMessage = link.getMode() == ShareLink.ShareMode.MINI
                ? "Bei kritischen Werten bitte sofort Eltern/Betreuer kontaktieren."
                : "Diese Ansicht ersetzt keine ärztliche Beurteilung.";

        return new ShareDtos.PublicShareResponse(
                link.getMode(),
                link.getOwner().getName(),
                link.getOwner().getAvatar(),
                lastBz != null ? lastBz.getBzValue() : null,
                lastBz != null ? lastBz.getTimestamp() : null,
                metrics.tirPercent().doubleValue(),
                metrics.gmi().doubleValue(),
                metrics.cvPercent().doubleValue(),
                emergencyMessage,
                patterns.insights().stream().map(InsightsDtos.PatternInsight::title).toList(),
                visibleEntries
        );
    }

    private String generateUniqueToken() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String token = randomToken(24);
            if (!shareLinkRepository.existsByToken(token)) return token;
        }
        throw new IllegalStateException("Konnte keinen eindeutigen Share-Token erzeugen.");
    }

    private String randomToken(int len) {
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(TOKEN_CHARS.charAt(RNG.nextInt(TOKEN_CHARS.length())));
        }
        return sb.toString();
    }

    private String buildLabel(Entry entry) {
        String type = entry.getType().toString().toUpperCase(Locale.ROOT);
        if ("BZ".equals(type)) return (entry.getBzValue() != null ? entry.getBzValue() : "-") + " mg/dL";
        if ("INSULIN".equals(type)) return (entry.getInsulinUnits() != null ? entry.getInsulinUnits() : "-") + " IE";
        if ("MEAL".equals(type)) return (entry.getMealName() != null ? entry.getMealName() : "Mahlzeit") +
                (entry.getMealKh() != null ? " (" + entry.getMealKh() + " g KH)" : "");
        if ("ACTIVITY".equals(type)) return (entry.getActivityName() != null ? entry.getActivityName() : "Aktivität");
        if ("KETONE".equals(type)) return "Ketone " + (entry.getKetoneValue() != null ? entry.getKetoneValue() : "-");
        return type;
    }
}
