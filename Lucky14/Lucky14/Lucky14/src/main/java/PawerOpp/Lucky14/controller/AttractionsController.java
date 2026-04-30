package PawerOpp.Lucky14.controller;

import PawerOpp.Lucky14.Service.attractions.IAttractions;
import PawerOpp.Lucky14.dto.attraction.AttractionRequest;
import PawerOpp.Lucky14.dto.attraction.AttractionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/attractions")
@Validated
public class AttractionsController {

    private final IAttractions attractionsService;

    @PostMapping("/addAttraction")
    public ResponseEntity<AttractionResponse> addAttraction(
            @RequestBody @jakarta.validation.Valid AttractionRequest request
    ){
        return ResponseEntity.ok(attractionsService.create(request));
    }

    @GetMapping("/getAttractionById")
    public ResponseEntity<AttractionResponse> getAttractionById(@RequestParam Long id){
        return ResponseEntity.ok(attractionsService.getById(id));
    }

    @GetMapping("/getAllAttractions")
    public ResponseEntity<List<AttractionResponse>> getAllAttractions(){
        return ResponseEntity.ok(attractionsService.getAll());
    }

    @PatchMapping("/updateAttractionById")
    public ResponseEntity<AttractionResponse> updateAttraction(
            @RequestParam Long id,
            @RequestBody @jakarta.validation.Valid AttractionRequest request
    ){
        return ResponseEntity.ok(attractionsService.update(id, request));
    }

    @DeleteMapping("/deleteAttractionById")
    public ResponseEntity<String> deleteAttraction(@RequestParam Long id){
        attractionsService.deactivate(id);
        return ResponseEntity.ok("Attraction deactivated successfully.");
    }

}
