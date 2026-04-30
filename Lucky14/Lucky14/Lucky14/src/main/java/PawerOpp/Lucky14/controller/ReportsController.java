package PawerOpp.Lucky14.controller;

import PawerOpp.Lucky14.Service.reports.IReports;
import PawerOpp.Lucky14.dto.reports.ReportsRequest;
import PawerOpp.Lucky14.dto.reports.ReportsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/reports")
@Validated
public class ReportsController {

    private final IReports reportsService;

    @PostMapping("/addReport")
    public ResponseEntity<ReportsResponse> createReport(
            @RequestParam Long generatedByUserId,
            @RequestBody @jakarta.validation.Valid ReportsRequest request
    ){
        return ResponseEntity.ok(reportsService.generateDailyReport(request, generatedByUserId));
    }

    @GetMapping("/getReportById")
    public ResponseEntity<ReportsResponse> getReportById(@RequestParam Long id){
        return ResponseEntity.ok(reportsService.getById(id));
    }

    @GetMapping("/getAllReports")
    public ResponseEntity<List<ReportsResponse>> getAllReports(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ){
        return ResponseEntity.ok(reportsService.getAll(branchId, from, to));
    }

    @PatchMapping("/updateReportById")
    public ResponseEntity<ReportsResponse> updateReport(
            @RequestParam Long id,
            @RequestParam Long finalizedByUserId
    ){
        return ResponseEntity.ok(reportsService.finalizeReport(id, finalizedByUserId));
    }

    @GetMapping("/getMonthlyConsolidated")
    public ResponseEntity<Map<String, Double>> getMonthlyConsolidated(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ){
        return ResponseEntity.ok(reportsService.generateMonthlyConsolidatedReport(from, to));
    }


}
