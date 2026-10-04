package com.example.task_manager_api.controllers;

import com.example.task_manager_api.mongo.document.CardDoc;
import com.example.task_manager_api.mongo.service.OperationsService;
import com.example.task_manager_api.services.KanbanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Rotas extras usadas pelo front-end Angular.
 * (As consultas e o restante continuam no MongoOperationsController.)
 */
@RestController
@RequestMapping("/api/mongo")
@RequiredArgsConstructor
public class KanbanController {

    private final KanbanService service;

    @PostMapping("/cards")
    public ResponseEntity<CardDoc> createCard(@RequestBody CardDoc card) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createCard(card));
    }

    @PutMapping("/cards/{id}")
    public ResponseEntity<CardDoc> updateCard(@PathVariable String id, @RequestBody CardDoc card) {
        return ResponseEntity.ok(service.updateCard(id, card));
    }

    @PutMapping("/cards/reorder")
    public ResponseEntity<List<CardDoc>> reorder(@RequestBody List<KanbanService.CardMove> moves) {
        return ResponseEntity.ok(service.reorder(moves));
    }

    @DeleteMapping("/boards/{id}")
    public ResponseEntity<Map<String, Object>> deleteBoard(@PathVariable String id) {
        return ResponseEntity.ok(service.deleteBoard(id));
    }
}
