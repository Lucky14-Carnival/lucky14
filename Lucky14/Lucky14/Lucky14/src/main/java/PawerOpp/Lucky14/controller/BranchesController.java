package PawerOpp.Lucky14.controller;

import PawerOpp.Lucky14.Service.branches.IBranches;
import PawerOpp.Lucky14.dto.branches.BranchesRequest;
import PawerOpp.Lucky14.dto.branches.BranchesResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/branches")
@Validated
public class BranchesController {

    private final IBranches branchesService;

    @PostMapping("/addBranch")
    public ResponseEntity<BranchesResponse> addBranch(@RequestBody @jakarta.validation.Valid BranchesRequest request){
        return ResponseEntity.ok(branchesService.create(request));
    }

    @GetMapping("/getBranchById")
    public ResponseEntity<BranchesResponse> getBranchById(@RequestParam Long id){
        return ResponseEntity.ok(branchesService.getById(id));
    }

    @GetMapping("/getAllBranches")
    public ResponseEntity<List<BranchesResponse>> getAllBranches(){
        return ResponseEntity.ok(branchesService.getAll());
    }

    @PatchMapping("/updateBranchById")
    public ResponseEntity<BranchesResponse> updateBranch(
            @RequestParam Long id,
            @RequestBody @jakarta.validation.Valid BranchesRequest request
    ){
        return ResponseEntity.ok(branchesService.update(id, request));
    }

    @DeleteMapping("/deleteBranchById")
    public ResponseEntity<String> deleteBranch(
            @RequestParam Long id,
            @RequestParam(defaultValue = "inactive") String action
    ){
        if ("delete".equalsIgnoreCase(action)) {
            branchesService.delete(id);
            return ResponseEntity.ok("Branch deleted successfully.");
        }

        branchesService.deactivate(id);
        return ResponseEntity.ok("Branch deactivated successfully.");
    }

}
