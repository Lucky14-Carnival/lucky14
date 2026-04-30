package PawerOpp.Lucky14.Service.attractions;

import PawerOpp.Lucky14.dto.attraction.AttractionRequest;
import PawerOpp.Lucky14.dto.attraction.AttractionResponse;
import PawerOpp.Lucky14.model.Attraction;
import PawerOpp.Lucky14.model.Branch;
import PawerOpp.Lucky14.repository.AttractionsRepository;
import PawerOpp.Lucky14.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttractionService implements IAttractions{

    private final AttractionsRepository attractionsRepository;
    private final BranchRepository branchRepository;

    @Override
    public AttractionResponse create(AttractionRequest request) {
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));

        Attraction attraction = new Attraction();
        attraction.setBranch(branch);
        attraction.setName(normalizeName(request.getName()));
        attraction.setBudget(request.getBudget());
        attraction.setSpentBudget(request.getSpentBudget());
        attraction.setCreatedAt(LocalDateTime.now());
        attraction.setUpdatedAt(LocalDateTime.now());
        attraction.setActive(Boolean.TRUE.equals(request.getActive()));
        return toResponse(attractionsRepository.save(attraction));
    }

    @Override
    public AttractionResponse getById(Long id) {
        Attraction attraction = attractionsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Attraction not found"));
        return toResponse(attraction);
    }

    @Override
    public List<AttractionResponse> getAll() {
        return attractionsRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public AttractionResponse update(Long id, AttractionRequest request) {
        Attraction attraction = attractionsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Attraction not found"));
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));

        attraction.setBranch(branch);
        attraction.setName(normalizeName(request.getName()));
        attraction.setBudget(request.getBudget());
        attraction.setSpentBudget(request.getSpentBudget());
        attraction.setActive(Boolean.TRUE.equals(request.getActive()));
        attraction.setUpdatedAt(LocalDateTime.now());
        return toResponse(attractionsRepository.save(attraction));
    }

    @Override
    public void deactivate(Long id) {
        Attraction attraction = attractionsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Attraction not found"));
        attraction.setActive(false);
        attraction.setUpdatedAt(LocalDateTime.now());
        attractionsRepository.save(attraction);
    }

    public AttractionResponse toResponse(Attraction attraction) {
        return AttractionResponse.builder()
                .id(attraction.getId())
                .branchId(attraction.getBranch() == null ? null : attraction.getBranch().getId())
                .name(normalizeName(attraction.getName()))
                .budget(attraction.getBudget())
                .spentBudget(attraction.getSpentBudget())
                .active(attraction.isActive())
                .build();
    }

    private String normalizeName(String value) {
        if (value == null) {
            return null;
        }
        return value.trim().replaceAll("\\s{2,}", " ");
    }

}
