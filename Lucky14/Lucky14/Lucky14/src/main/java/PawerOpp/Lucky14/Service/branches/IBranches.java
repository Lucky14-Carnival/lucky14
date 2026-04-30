package PawerOpp.Lucky14.Service.branches;

import PawerOpp.Lucky14.dto.branches.BranchesRequest;
import PawerOpp.Lucky14.dto.branches.BranchesResponse;

import java.util.List;

public interface IBranches {

    BranchesResponse create(BranchesRequest request);
    BranchesResponse getById(Long id);
    List<BranchesResponse> getAll();
    BranchesResponse update(Long id, BranchesRequest request);
    void deactivate(Long id);
    void delete(Long id);

}
