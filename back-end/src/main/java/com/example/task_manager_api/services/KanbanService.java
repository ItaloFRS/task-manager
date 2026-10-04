package com.example.task_manager_api.services;

import com.example.task_manager_api.mongo.document.CardDoc;
import com.example.task_manager_api.mongo.repository.MgBoardRepository;
import com.example.task_manager_api.mongo.repository.MgCardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Operações que o front-end (Angular) precisa e que ainda não existiam:
 * criar um card, editar, reordenar (arrastar e soltar) e excluir um board com seus cards.
 */
@Service
@RequiredArgsConstructor
public class KanbanService {

    private static final Set<String> STATUSES = Set.of("TODO", "IN_PROGRESS", "DONE");
    private static final Set<String> PRIORITIES = Set.of("LOW", "MEDIUM", "HIGH");

    private final MgBoardRepository boardRepository;
    private final MgCardRepository cardRepository;
    private final MongoTemplate mongoTemplate;

    /** Item enviado pelo front depois de arrastar um card. */
    public record CardMove(String id, String status, Integer position) {
    }

    // ------------------------------------------------------------------
    // insertOne de card
    // ------------------------------------------------------------------
    public CardDoc createCard(CardDoc card) {
        if (card.getTitle() == null || card.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O título é obrigatório");
        }
        if (card.getBoardId() == null || !boardRepository.existsById(card.getBoardId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Board não encontrado");
        }

        LocalDateTime now = LocalDateTime.now();
        card.setId(null);
        card.setTitle(card.getTitle().trim());
        card.setStatus(card.getStatus() == null ? "TODO" : normalizeStatus(card.getStatus()));
        card.setPriority(card.getPriority() == null ? "MEDIUM" : normalizePriority(card.getPriority()));
        if (card.getPosition() == null) {
            card.setPosition(0);
        }
        card.setCompletedAt("DONE".equals(card.getStatus()) ? now : null);
        card.setCreatedAt(now);
        card.setUpdatedAt(now);

        return cardRepository.insert(card);
    }

    // ------------------------------------------------------------------
    // update de card (edição completa pelo painel lateral)
    // ------------------------------------------------------------------
    public CardDoc updateCard(String id, CardDoc body) {
        CardDoc card = cardRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Card não encontrado"));

        if (body.getTitle() == null || body.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O título é obrigatório");
        }

        card.setTitle(body.getTitle().trim());
        card.setDescription(body.getDescription());
        card.setPriority(normalizePriority(body.getPriority()));
        card.setAssigneeName(body.getAssigneeName());
        card.setDueDate(body.getDueDate());
        if (body.getPosition() != null) {
            card.setPosition(body.getPosition());
        }
        applyStatus(card, normalizeStatus(body.getStatus()));
        card.setUpdatedAt(LocalDateTime.now());

        return cardRepository.save(card);
    }

    // ------------------------------------------------------------------
    // reordenar (muda status e posição de vários cards de uma vez)
    // ------------------------------------------------------------------
    public List<CardDoc> reorder(List<CardMove> moves) {
        Map<String, CardMove> byId = moves.stream()
                .collect(Collectors.toMap(CardMove::id, Function.identity(), (a, b) -> b));

        List<CardDoc> cards = cardRepository.findAllById(byId.keySet());
        LocalDateTime now = LocalDateTime.now();

        for (CardDoc card : cards) {
            CardMove move = byId.get(card.getId());
            applyStatus(card, normalizeStatus(move.status()));
            card.setPosition(move.position() == null ? 0 : move.position());
            card.setUpdatedAt(now);
        }
        return cardRepository.saveAll(cards);
    }

    // ------------------------------------------------------------------
    // delete de board (e de todos os cards dele)
    // ------------------------------------------------------------------
    public Map<String, Object> deleteBoard(String id) {
        if (!boardRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Board não encontrado");
        }
        long deletedCards = mongoTemplate
                .remove(new Query(Criteria.where("boardId").is(id)), CardDoc.class)
                .getDeletedCount();
        boardRepository.deleteById(id);

        return Map.of("deletedCards", deletedCards);
    }

    // ------------------------------------------------------------------
    // auxiliares
    // ------------------------------------------------------------------
    /** Regra do completedAt: preenche ao entrar em DONE, remove ao sair. */
    private void applyStatus(CardDoc card, String newStatus) {
        if ("DONE".equals(newStatus)) {
            if (!"DONE".equals(card.getStatus()) || card.getCompletedAt() == null) {
                card.setCompletedAt(LocalDateTime.now());
            }
        } else {
            card.setCompletedAt(null);
        }
        card.setStatus(newStatus);
    }

    private String normalizeStatus(String status) {
        String value = status == null ? "" : status.trim().toUpperCase();
        if (!STATUSES.contains(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Status inválido. Use TODO, IN_PROGRESS ou DONE");
        }
        return value;
    }

    private String normalizePriority(String priority) {
        String value = priority == null ? "" : priority.trim().toUpperCase();
        if (!PRIORITIES.contains(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Prioridade inválida. Use LOW, MEDIUM ou HIGH");
        }
        return value;
    }
}
