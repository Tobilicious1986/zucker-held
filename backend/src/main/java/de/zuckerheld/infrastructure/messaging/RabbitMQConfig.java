package de.zuckerheld.infrastructure.messaging;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ-Konfiguration für Zucker-Held Benachrichtigungen.
 * Exchange: zh.alerts (Direct)
 * Queues:   zh.queue.bz-alert, zh.queue.ketone-reminder, zh.queue.daily-summary,
 *           zh.queue.guardian-ping, zh.queue.routine-reminder
 */
@Configuration
public class RabbitMQConfig {

    // ── Exchange ───────────────────────────────────────────────────────────

    public static final String EXCHANGE_ALERTS      = "zh.alerts";

    // ── Queues ─────────────────────────────────────────────────────────────

    public static final String QUEUE_BZ_ALERT        = "zh.queue.bz-alert";
    public static final String QUEUE_KETONE_REMINDER  = "zh.queue.ketone-reminder";
    public static final String QUEUE_DAILY_SUMMARY    = "zh.queue.daily-summary";
    public static final String QUEUE_GUARDIAN_PING    = "zh.queue.guardian-ping";
    public static final String QUEUE_ROUTINE_REMINDER = "zh.queue.routine-reminder";

    // ── Routing Keys ───────────────────────────────────────────────────────

    public static final String KEY_BZ_ALERT          = "bz-alert-key";
    public static final String KEY_KETONE_REMINDER    = "ketone-key";
    public static final String KEY_DAILY_SUMMARY      = "daily-summary-key";
    public static final String KEY_GUARDIAN_PING      = "guardian-ping-key";
    public static final String KEY_ROUTINE_REMINDER   = "routine-reminder-key";

    // ── Beans ──────────────────────────────────────────────────────────────

    @Bean
    public DirectExchange alertsExchange() {
        return new DirectExchange(EXCHANGE_ALERTS, true, false);
    }

    @Bean
    public Queue bzAlertQueue() {
        return QueueBuilder.durable(QUEUE_BZ_ALERT).build();
    }

    @Bean
    public Queue ketoneReminderQueue() {
        // TTL von 1 Stunde (3 600 000 ms) für Ketone-Erinnerungen
        return QueueBuilder.durable(QUEUE_KETONE_REMINDER)
                .withArgument("x-message-ttl", 3_600_000)
                .build();
    }

    @Bean
    public Queue dailySummaryQueue() {
        return QueueBuilder.durable(QUEUE_DAILY_SUMMARY).build();
    }

    @Bean
    public Queue guardianPingQueue() {
        return QueueBuilder.durable(QUEUE_GUARDIAN_PING).build();
    }

    @Bean
    public Queue routineReminderQueue() {
        return QueueBuilder.durable(QUEUE_ROUTINE_REMINDER).build();
    }

    @Bean
    public Binding bzAlertBinding(Queue bzAlertQueue, DirectExchange alertsExchange) {
        return BindingBuilder.bind(bzAlertQueue)
                .to(alertsExchange)
                .with(KEY_BZ_ALERT);
    }

    @Bean
    public Binding ketoneReminderBinding(Queue ketoneReminderQueue, DirectExchange alertsExchange) {
        return BindingBuilder.bind(ketoneReminderQueue)
                .to(alertsExchange)
                .with(KEY_KETONE_REMINDER);
    }

    @Bean
    public Binding dailySummaryBinding(Queue dailySummaryQueue, DirectExchange alertsExchange) {
        return BindingBuilder.bind(dailySummaryQueue)
                .to(alertsExchange)
                .with(KEY_DAILY_SUMMARY);
    }

    @Bean
    public Binding guardianPingBinding(Queue guardianPingQueue, DirectExchange alertsExchange) {
        return BindingBuilder.bind(guardianPingQueue)
                .to(alertsExchange)
                .with(KEY_GUARDIAN_PING);
    }

    @Bean
    public Binding routineReminderBinding(Queue routineReminderQueue, DirectExchange alertsExchange) {
        return BindingBuilder.bind(routineReminderQueue)
                .to(alertsExchange)
                .with(KEY_ROUTINE_REMINDER);
    }

    /** JSON-Serialisierung für alle AMQP-Nachrichten */
    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /** RabbitTemplate mit JSON-Converter konfigurieren */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                         MessageConverter messageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter);
        return template;
    }
}
