package PawerOpp.Lucky14.Service.attractions;

import PawerOpp.Lucky14.dto.attraction.AttractionRequest;
import PawerOpp.Lucky14.dto.attraction.AttractionResponse;
import PawerOpp.Lucky14.model.Attraction;

import java.util.List;

public interface IAttractions {

    AttractionResponse create(AttractionRequest request);
    AttractionResponse getById(Long id);
    List<AttractionResponse> getAll();
    AttractionResponse update(Long id, AttractionRequest request);
    void deactivate(Long id);
    AttractionResponse toResponse(Attraction attraction);

}
