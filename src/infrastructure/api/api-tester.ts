import apiClient from "./api-client";

export interface TestResult {
  name: string;
  status: "success" | "failure" | "pending";
  statusCode?: number;
  message: string;
  response?: any;
  error?: string;
  duration: number;
}

export class APIMockBackendTester {
  private results: TestResult[] = [];
  private baseUrl = apiClient.defaults.baseURL || "http://localhost:8080";

  async runAllTests(): Promise<TestResult[]> {
    this.results = [];

    console.log("🧪 Starting API Tests...");
    console.log(`📡 Base URL: ${this.baseUrl}`);
    console.log("----------------------------------------");

    // Test 1: Basic connectivity
    await this.testConnectivity();

    // Test 2: Login
    const loginResult = await this.testLogin();

    // Only run subsequent tests if login succeeded
    if (loginResult.status === "success") {
      const token = loginResult.response?.token;

      // Test 3: Get Creators
      await this.testGetCreators(token);

      // Test 4: Create Creator
      await this.testCreateCreator(token);

      // Test 5: Get Brands
      await this.testGetBrands(token);

      // Test 6: Logout
      await this.testLogout(token);
    }

    return this.results;
  }

  private async testConnectivity(): Promise<void> {
    const startTime = performance.now();
    console.log("📍 Test 1: API Connectivity");

    try {
      // Try to reach the base URL
      const response = await fetch(this.baseUrl, {
        method: "HEAD",
        mode: "cors",
      }).catch(() =>
        // Fallback: try GET
        fetch(`${this.baseUrl}/`, {
          method: "GET",
          mode: "cors",
        }),
      );

      const duration = performance.now() - startTime;

      this.results.push({
        name: "API Connectivity",
        status: response ? "success" : "failure",
        statusCode: response?.status,
        message: response
          ? `Server is reachable (${response.status})`
          : "Server is unreachable",
        duration: Math.round(duration),
      });

      console.log(
        `✓ Status: ${response?.status || "No response"} (${Math.round(duration)}ms)`,
      );
    } catch (error: any) {
      const duration = performance.now() - startTime;

      this.results.push({
        name: "API Connectivity",
        status: "failure",
        message: `Connection failed: ${error.message}`,
        error: error.message,
        duration: Math.round(duration),
      });

      console.log(
        `✗ Connection Error: ${error.message} (${Math.round(duration)}ms)`,
      );
    }
  }

  private async testLogin(): Promise<TestResult> {
    const startTime = performance.now();
    console.log("\n📍 Test 2: Login");

    try {
      const response = await apiClient.post("/auth/login", {
        username: "admin",
        password: "admin",
      });

      const duration = performance.now() - startTime;
      const result: TestResult = {
        name: "Login",
        status: "success",
        statusCode: response.status,
        message: `Logged in as ${response.data.user?.username || "unknown"}`,
        response: response.data,
        duration: Math.round(duration),
      };

      this.results.push(result);
      console.log(
        `✓ Login successful for: ${response.data.user?.username} (${Math.round(duration)}ms)`,
      );
      console.log(
        `  Token: ${response.data.token?.substring(0, 30)}... (${response.data.token?.length} chars)`,
      );

      return result;
    } catch (error: any) {
      const duration = performance.now() - startTime;
      const errorMsg = this.extractErrorMessage(error);

      const result: TestResult = {
        name: "Login",
        status: "failure",
        statusCode: error.response?.status,
        message: `Login failed: ${errorMsg}`,
        error: errorMsg,
        response: error.response?.data,
        duration: Math.round(duration),
      };

      this.results.push(result);
      console.log(
        `✗ Login failed: ${errorMsg} (Status: ${error.response?.status || "No response"}) (${Math.round(duration)}ms)`,
      );

      return result;
    }
  }

  private async testGetCreators(token: string): Promise<void> {
    const startTime = performance.now();
    console.log("\n📍 Test 3: Get Creators");

    try {
      const response = await apiClient.get("/creators", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const duration = performance.now() - startTime;

      this.results.push({
        name: "Get Creators",
        status: "success",
        statusCode: response.status,
        message: `Retrieved ${
          Array.isArray(response.data) ? response.data.length : 0
        } creators`,
        response: response.data,
        duration: Math.round(duration),
      });

      console.log(
        `✓ Retrieved ${Array.isArray(response.data) ? response.data.length : 0} creators (${Math.round(duration)}ms)`,
      );
    } catch (error: any) {
      const duration = performance.now() - startTime;
      const errorMsg = this.extractErrorMessage(error);

      this.results.push({
        name: "Get Creators",
        status: "failure",
        statusCode: error.response?.status,
        message: `Failed to get creators: ${errorMsg}`,
        error: errorMsg,
        response: error.response?.data,
        duration: Math.round(duration),
      });

      console.log(`✗ Get creators failed: ${errorMsg} (${Math.round(duration)}ms)`);
    }
  }

  private async testCreateCreator(token: string): Promise<void> {
    const startTime = performance.now();
    console.log("\n📍 Test 4: Create Creator");

    try {
      const testData = {
        name: "API Tester",
        username: `tester_${Date.now()}`,
        password: "testpass123",
        brands: ["Nike"],
      };

      const response = await apiClient.post("/creators", testData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const duration = performance.now() - startTime;

      this.results.push({
        name: "Create Creator",
        status: "success",
        statusCode: response.status,
        message: `Created creator: ${response.data?.id || "unknown"}`,
        response: response.data,
        duration: Math.round(duration),
      });

      console.log(
        `✓ Created creator: ${response.data?.id || "unknown"} (${Math.round(duration)}ms)`,
      );
    } catch (error: any) {
      const duration = performance.now() - startTime;
      const errorMsg = this.extractErrorMessage(error);

      this.results.push({
        name: "Create Creator",
        status: "failure",
        statusCode: error.response?.status,
        message: `Failed to create creator: ${errorMsg}`,
        error: errorMsg,
        response: error.response?.data,
        duration: Math.round(duration),
      });

      console.log(
        `✗ Create creator failed: ${errorMsg} (${Math.round(duration)}ms)`,
      );
    }
  }

  private async testGetBrands(token: string): Promise<void> {
    const startTime = performance.now();
    console.log("\n📍 Test 5: Get Brands");

    try {
      const response = await apiClient.get("/brands", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const duration = performance.now() - startTime;
      const brandCount = Array.isArray(response.data) ? response.data.length : 0;

      this.results.push({
        name: "Get Brands",
        status: "success",
        statusCode: response.status,
        message: `Retrieved ${brandCount} brands`,
        response: response.data,
        duration: Math.round(duration),
      });

      console.log(`✓ Retrieved ${brandCount} brands (${Math.round(duration)}ms)`);
      if (Array.isArray(response.data)) {
        console.log(`  Brands: ${response.data.slice(0, 5).join(", ")}${response.data.length > 5 ? "..." : ""}`);
      }
    } catch (error: any) {
      const duration = performance.now() - startTime;
      const errorMsg = this.extractErrorMessage(error);

      this.results.push({
        name: "Get Brands",
        status: "failure",
        statusCode: error.response?.status,
        message: `Failed to get brands: ${errorMsg}`,
        error: errorMsg,
        response: error.response?.data,
        duration: Math.round(duration),
      });

      console.log(`✗ Get brands failed: ${errorMsg} (${Math.round(duration)}ms)`);
    }
  }

  private async testLogout(token: string): Promise<void> {
    const startTime = performance.now();
    console.log("\n📍 Test 6: Logout");

    try {
      const response = await apiClient.post(
        "/auth/logout",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const duration = performance.now() - startTime;

      this.results.push({
        name: "Logout",
        status: "success",
        statusCode: response.status,
        message: "Logged out successfully",
        response: response.data,
        duration: Math.round(duration),
      });

      console.log(`✓ Logged out successfully (${Math.round(duration)}ms)`);
    } catch (error: any) {
      const duration = performance.now() - startTime;
      const errorMsg = this.extractErrorMessage(error);

      this.results.push({
        name: "Logout",
        status: "failure",
        statusCode: error.response?.status,
        message: `Failed to logout: ${errorMsg}`,
        error: errorMsg,
        response: error.response?.data,
        duration: Math.round(duration),
      });

      console.log(`✗ Logout failed: ${errorMsg} (${Math.round(duration)}ms)`);
    }
  }

  private extractErrorMessage(error: any): string {
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return "Unknown error";
  }

  printSummary(): void {
    console.log("\n========================================");
    console.log("📊 TEST SUMMARY");
    console.log("========================================");

    const passed = this.results.filter((r) => r.status === "success").length;
    const failed = this.results.filter((r) => r.status === "failure").length;
    const total = this.results.length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n✓ Passed: ${passed}/${total}`);
    console.log(`✗ Failed: ${failed}/${total}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);

    console.log("\nDetailed Results:");
    this.results.forEach((result, index) => {
      const icon = result.status === "success" ? "✓" : "✗";
      console.log(`\n${index + 1}. ${result.name}`);
      console.log(`   Status: ${icon} ${result.status}`);
      console.log(`   Message: ${result.message}`);
      console.log(`   Duration: ${result.duration}ms`);
      if (result.statusCode) {
        console.log(`   HTTP Status: ${result.statusCode}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log("\n========================================");

    if (failed === 0) {
      console.log("🎉 All tests passed! API is working correctly.");
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Check the details above.`);
    }
  }

  getResults(): TestResult[] {
    return this.results;
  }
}

// Export singleton
export const apiTester = new APIMockBackendTester();
