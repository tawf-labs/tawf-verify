// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {TawfVerifyRegistry} from "../src/TawfVerifyRegistry.sol";

/// @notice Deploys TawfVerifyRegistry. No constructor args: authority is bootstrapped per-org
/// after deployment via registerOrg/setSigner, never at deploy time (prd.md Section 10.3 —
/// there is deliberately no global owner for this deployment script to hand off to).
contract Deploy is Script {
    function run() external returns (TawfVerifyRegistry registry) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        registry = new TawfVerifyRegistry();
        vm.stopBroadcast();

        console.log("TawfVerifyRegistry deployed at:", address(registry));
    }
}
