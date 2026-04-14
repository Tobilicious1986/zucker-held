package de.zuckerheld.domain.service.food;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public final class FoodMetadataHeuristics {

    private FoodMetadataHeuristics() {}

    public static String normalize(String value) {
        if (value == null) {
            return "";
        }

        return value.toLowerCase(Locale.ROOT)
                .replace("ä", "ae")
                .replace("ö", "oe")
                .replace("ü", "ue")
                .replace("ß", "ss")
                .replaceAll("[^a-z0-9]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    public static String inferCategory(String... texts) {
        List<String> safeTexts = new ArrayList<>();
        if (texts != null) {
            for (String text : texts) {
                if (text != null && !text.isBlank()) {
                    safeTexts.add(text);
                }
            }
        }
        String haystack = normalize(String.join(" ", safeTexts));

        if (containsAny(haystack, "brot", "broetchen", "toast", "baguette", "brezel", "croissant", "semmel", "weck")) {
            return "brot_getreide";
        }
        if (containsAny(haystack, "muesli", "cornflakes", "hafer", "porridge", "cereal", "granola")) {
            return "fruehstueck_muesli";
        }
        if (containsAny(haystack, "nudel", "reis", "couscous", "bulgur", "quinoa", "spaetzle", "gnocchi")) {
            return "nudeln_reis_getreide";
        }
        if (containsAny(haystack, "kartoffel", "pommes", "krokette", "pueree", "puffer", "gratin")) {
            return "kartoffeln_beilagen";
        }
        if (containsAny(haystack, "milch", "joghurt", "quark", "kaese", "gouda", "mozzarella", "skyr", "frischkaese")) {
            return "milchprodukte";
        }
        if (containsAny(haystack, "apfel", "banane", "orange", "traube", "erdbeer", "kirsch", "birne", "mango", "ananas", "beere")) {
            return "obst";
        }
        if (containsAny(haystack, "gurke", "tomate", "karotte", "mais", "erbsen", "paprika", "salat", "gemuese", "brokkoli")) {
            return "gemuese";
        }
        if (containsAny(haystack, "saft", "cola", "fanta", "sprite", "eistee", "schorle", "kakao", "limonade", "getraenk")) {
            return "getraenke";
        }
        if (containsAny(haystack, "pizza", "burger", "doener", "wrap", "lasagne", "pommes", "fastfood", "hot dog")) {
            return "hauptgerichte_fastfood";
        }
        if (containsAny(haystack, "schul", "riegel", "keks", "schokolade", "gummibaer", "snack", "waffel", "pudding", "traubenzucker")) {
            return "schule_snacks_alltag";
        }
        return "suesses_snacks";
    }

    public static String inferEmoji(String category, String name) {
        String normalizedName = normalize(name);

        if (normalizedName.contains("apfel")) return "🍎";
        if (normalizedName.contains("banane")) return "🍌";
        if (normalizedName.contains("pizza")) return "🍕";
        if (normalizedName.contains("burger")) return "🍔";
        if (normalizedName.contains("pommes")) return "🍟";
        if (normalizedName.contains("traubenzucker")) return "🍬";
        if (normalizedName.contains("cola") || normalizedName.contains("saft")) return "🥤";
        if (normalizedName.contains("joghurt") || normalizedName.contains("milch")) return "🥛";
        if (normalizedName.contains("nudel")) return "🍝";
        if (normalizedName.contains("reis")) return "🍚";

        return switch (category) {
            case "brot_getreide" -> "🍞";
            case "fruehstueck_muesli" -> "🥣";
            case "nudeln_reis_getreide" -> "🍝";
            case "kartoffeln_beilagen" -> "🥔";
            case "milchprodukte" -> "🥛";
            case "obst" -> "🍎";
            case "gemuese" -> "🥕";
            case "getraenke" -> "🥤";
            case "hauptgerichte_fastfood" -> "🍽️";
            case "schule_snacks_alltag" -> "🎒";
            default -> "🍴";
        };
    }

    public static List<Integer> defaultPortionPresets(String category, String name) {
        String normalizedName = normalize(name);

        if (normalizedName.contains("traubenzucker")) return List.of(4, 8, 12);
        if (normalizedName.contains("saft") || normalizedName.contains("cola") || normalizedName.contains("schorle")) {
            return List.of(150, 200, 250);
        }
        if (normalizedName.contains("joghurt") || normalizedName.contains("pudding") || normalizedName.contains("quark")) {
            return List.of(100, 150, 200);
        }
        if (normalizedName.contains("pizza") || normalizedName.contains("burger") || normalizedName.contains("lasagne")) {
            return List.of(120, 180, 250);
        }
        if (normalizedName.contains("broetchen") || normalizedName.contains("brot") || normalizedName.contains("brezel")) {
            return List.of(30, 60, 90);
        }

        return switch (category) {
            case "brot_getreide" -> List.of(30, 60, 90);
            case "fruehstueck_muesli" -> List.of(30, 45, 60);
            case "nudeln_reis_getreide" -> List.of(75, 125, 200);
            case "kartoffeln_beilagen" -> List.of(100, 150, 200);
            case "milchprodukte" -> List.of(100, 150, 200);
            case "obst" -> List.of(80, 120, 160);
            case "gemuese" -> List.of(80, 120, 180);
            case "getraenke" -> List.of(150, 200, 250);
            case "hauptgerichte_fastfood" -> List.of(120, 180, 250);
            case "schule_snacks_alltag", "suesses_snacks" -> List.of(20, 35, 50);
            default -> List.of(30, 60, 100);
        };
    }

    public static List<String> defaultAliases(String name) {
        String normalizedName = normalize(name);
        Set<String> aliases = new LinkedHashSet<>();

        if (!normalizedName.isBlank() && !normalizedName.equals(name.toLowerCase(Locale.ROOT))) {
            aliases.add(normalizedName);
        }
        if (normalizedName.contains("broetchen")) aliases.add("semmel");
        if (normalizedName.contains("pommes")) aliases.add("fritten");
        if (normalizedName.contains("cola zero") || normalizedName.contains("cola light")) aliases.add("cola light");
        if (normalizedName.contains("gummibaer")) aliases.add("gummibärchen");
        if (normalizedName.contains("nutella")) aliases.add("nuss nougat creme");

        return new ArrayList<>(aliases);
    }

    private static boolean containsAny(String haystack, String... needles) {
        for (String needle : needles) {
            if (haystack.contains(normalize(needle))) {
                return true;
            }
        }
        return false;
    }
}
