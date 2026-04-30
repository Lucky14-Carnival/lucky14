package PawerOpp.Lucky14.controller;

import PawerOpp.Lucky14.Service.contactInfo.IContactInfo;
import PawerOpp.Lucky14.dto.contactInfo.ContactInfoRequest;
import PawerOpp.Lucky14.dto.contactInfo.ContactInfoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/contractInfo")
@Validated
public class ContractInfoController {

    private final IContactInfo contactInfoService;

    @PostMapping("/addContractInfo")
    public ResponseEntity<ContactInfoResponse> createContractInfo(
            @RequestBody @jakarta.validation.Valid ContactInfoRequest request
    ){
        return ResponseEntity.ok(contactInfoService.create(request));
    }

    @GetMapping("/getContractInfoById")
    public ResponseEntity<ContactInfoResponse> getContractInfoById(@RequestParam Long id){
        return ResponseEntity.ok(contactInfoService.getById(id));
    }

    @GetMapping("/getAllContractInfo")
    public ResponseEntity<List<ContactInfoResponse>> getAllContractInfo(
            @RequestParam(required = false) Long userId
    ){
        if (userId != null) {
            return ResponseEntity.ok(contactInfoService.getByUserId(userId));
        }
        return ResponseEntity.ok(contactInfoService.getAll());
    }

    @PatchMapping("/updateContractInfoById")
    public ResponseEntity<ContactInfoResponse> updateContractInfo(
            @RequestParam Long id,
            @RequestBody @jakarta.validation.Valid ContactInfoRequest request
    ){
        return ResponseEntity.ok(contactInfoService.update(id, request));
    }

    @DeleteMapping("/deleteContractInfoById")
    public ResponseEntity<String> deleteContractInfoById(@RequestParam Long id){
        contactInfoService.delete(id);
        return ResponseEntity.ok("Contact info deleted successfully.");
    }

}
