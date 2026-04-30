package PawerOpp.Lucky14.controller;

import PawerOpp.Lucky14.Service.users.IUsers;
import PawerOpp.Lucky14.dto.users.UsersRequest;
import PawerOpp.Lucky14.dto.users.UsersResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
@Validated
public class UsersController {

    private final IUsers usersService;

    @PostMapping("/addUser")
    public ResponseEntity<UsersResponse> addUser(
            @RequestParam(required = false) Long createdByUserId,
            @RequestBody @Valid UsersRequest request
    ){
        return ResponseEntity.ok(usersService.create(request, createdByUserId));
    }

    @GetMapping("/getUserById")
    public ResponseEntity<UsersResponse> getUserById(@RequestParam Long id){
        return ResponseEntity.ok(usersService.getById(id));
    }

    @GetMapping("/getAllUsers")
    public ResponseEntity<List<UsersResponse>> getAllUsers(@RequestParam(required = false) Long branchId){
        return ResponseEntity.ok(usersService.getAll(branchId));
    }

    @PatchMapping("/updateUserById")
    public ResponseEntity<UsersResponse> updateUserById(
            @RequestParam Long id,
            @RequestBody @Valid UsersRequest request
    ){
        return ResponseEntity.ok(usersService.update(id, request));
    }

    @DeleteMapping("/deleteUserById")
    public ResponseEntity<String> deleteUserById(
            @RequestParam Long id,
            @RequestParam(defaultValue = "inactive") String action
    ){
        if ("delete".equalsIgnoreCase(action)) {
            usersService.delete(id);
            return ResponseEntity.ok("User deleted successfully.");
        }

        usersService.deactivate(id);
        return ResponseEntity.ok("User deactivated successfully.");
    }

}
