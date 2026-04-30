package PawerOpp.Lucky14.controller;

import PawerOpp.Lucky14.Service.transactions.ITransactions;
import PawerOpp.Lucky14.dto.transaction.TransactionRequest;
import PawerOpp.Lucky14.dto.transaction.TransactionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/transactions")
@Validated
public class TransactionsController {

    private final ITransactions transactionsService;

    @PostMapping("/addBorrow")
    public ResponseEntity<TransactionResponse> borrow(
            @RequestBody @jakarta.validation.Valid TransactionRequest request
    ){
        return ResponseEntity.ok(transactionsService.create(request));
    }

    @GetMapping("/getBorrowById")
    public ResponseEntity<TransactionResponse> getBorrowById(
            @RequestParam Long id,
            @RequestParam(required = false) Long branchId
    ){
        return ResponseEntity.ok(transactionsService.getById(id, branchId));
    }

    @GetMapping("/getAllBorrows")
    public ResponseEntity<List<TransactionResponse>> getAllBorrows(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) TransactionRequest.TransactionType type
    ){
        return ResponseEntity.ok(transactionsService.getAll(branchId, date, type));
    }

    @PatchMapping("/updateBorrowById")
    public ResponseEntity<TransactionResponse> updateBorrowById(
            @RequestParam Long id,
            @RequestParam(required = false) Long branchId,
            @RequestBody @jakarta.validation.Valid TransactionRequest request
    ){
        return ResponseEntity.ok(transactionsService.update(id, branchId, request));
    }

    @DeleteMapping("/deleteBorrowById")
    public ResponseEntity<String> deleteBorrowById(
            @RequestParam Long id,
            @RequestParam(required = false) Long branchId
    ){
        transactionsService.delete(id, branchId);
        return ResponseEntity.ok("Transaction deleted successfully.");
    }


}
