package PawerOpp.Lucky14.Service.branches;

import PawerOpp.Lucky14.dto.branches.BranchesRequest;
import PawerOpp.Lucky14.dto.branches.BranchesResponse;
import PawerOpp.Lucky14.model.Branch;
import PawerOpp.Lucky14.repository.AttractionsRepository;
import PawerOpp.Lucky14.repository.BranchRepository;
import PawerOpp.Lucky14.repository.ContactInfoRepository;
import PawerOpp.Lucky14.repository.OtpRepository;
import PawerOpp.Lucky14.repository.ReportsRepository;
import PawerOpp.Lucky14.repository.TransactionRepository;
import PawerOpp.Lucky14.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BranchesService implements IBranches{

    private final BranchRepository branchRepository;
    private final UsersRepository usersRepository;
    private final AttractionsRepository attractionsRepository;
    private final ReportsRepository reportsRepository;
    private final TransactionRepository transactionRepository;
    private final ContactInfoRepository contactInfoRepository;
    private final OtpRepository otpRepository;

    @Override
    public BranchesResponse create(BranchesRequest request) {
        Branch branch = new Branch();
        branch.setProvince(request.getProvince());
        branch.setMunicipality(request.getMunicipality());
        branch.setBarangay(request.getBarangay());
        branch.setLandmark(request.getLandmark());
        branch.setCreatedAt(LocalDateTime.now());
        branch.setActive(Boolean.TRUE.equals(request.getActive()));
        return toResponse(branchRepository.save(branch));
    }

    @Override
    public BranchesResponse getById(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));
        return toResponse(branch);
    }

    @Override
    public List<BranchesResponse> getAll() {
        return branchRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public BranchesResponse update(Long id, BranchesRequest request) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));

        branch.setProvince(request.getProvince());
        branch.setMunicipality(request.getMunicipality());
        branch.setBarangay(request.getBarangay());
        branch.setLandmark(request.getLandmark());
        branch.setActive(Boolean.TRUE.equals(request.getActive()));
        return toResponse(branchRepository.save(branch));
    }

    @Override
    public void deactivate(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));
        branch.setActive(false);
        branchRepository.save(branch);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));
        transactionRepository.deleteAllByUsers_Branch_Id(id);
        transactionRepository.deleteAllByAttraction_Branch_Id(id);
        reportsRepository.deleteAllByBranch_Id(id);
        contactInfoRepository.deleteAllByUsers_Branch_Id(id);
        otpRepository.deleteAllByUsers_Branch_Id(id);
        usersRepository.deleteAllByBranch_Id(id);
        attractionsRepository.deleteAllByBranch_Id(id);
        branchRepository.delete(branch);
    }

    private BranchesResponse toResponse(Branch branch) {
        return BranchesResponse.builder()
                .id(branch.getId())
                .province(branch.getProvince())
                .municipality(branch.getMunicipality())
                .barangay(branch.getBarangay())
                .landmark(branch.getLandmark())
                .active(branch.isActive())
                .build();
    }

}
