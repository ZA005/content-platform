import { useState } from "react";
import { Loader, AlertCircle, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import apiClient from "@/infrastructure/api/api-client";

interface LoginTestResult {
  step: string;
  status: "pending" | "success" | "failure";
  message: string;
  details?: any;
  duration?: number;
}

export function LoginTestPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<LoginTestResult[]>([]);
  const [token, setToken] = useState<string | null>(null);

  const handleLoginTest = async () => {
    setIsLoading(true);
    setResults([]);
    setToken(null);

    const testResults: LoginTestResult[] = [];

    // Step 1: Check API Configuration
    testResults.push({
      step: "1. API Configuration",
      status: "pending",
      message: "Checking API client configuration...",
    });
    setResults([...testResults]);

    const apiBaseUrl = apiClient.defaults.baseURL;
    if (apiBaseUrl) {
      testResults[0] = {
        step: "1. API Configuration",
        status: "success",
        message: `API URL configured: ${apiBaseUrl}`,
        details: { baseUrl: apiBaseUrl },
      };
    } else {
      testResults[0] = {
        step: "1. API Configuration",
        status: "failure",
        message: "API URL not configured",
        details: { baseUrl: "undefined" },
      };
    }
    setResults([...testResults]);

    // Step 2: Network Connectivity Check
    testResults.push({
      step: "2. Network Connectivity",
      status: "pending",
      message: "Testing connection to API server...",
    });
    setResults([...testResults]);

    const connectStart = performance.now();
    try {
      const connectResponse = await fetch(`${apiBaseUrl}/`, {
        method: "HEAD",
        mode: "cors",
      }).catch(() => fetch(`${apiBaseUrl}auth/login`, { method: "OPTIONS", mode: "cors" }));

      const connectDuration = performance.now() - connectStart;

      if (connectResponse) {
        testResults[1] = {
          step: "2. Network Connectivity",
          status: "success",
          message: `Server is reachable (Status: ${connectResponse.status})`,
          details: { statusCode: connectResponse.status, headers: Object.fromEntries(connectResponse.headers) },
          duration: Math.round(connectDuration),
        };
      } else {
        testResults[1] = {
          step: "2. Network Connectivity",
          status: "failure",
          message: "Server did not respond",
          duration: Math.round(connectDuration),
        };
      }
    } catch (error: any) {
      const connectDuration = performance.now() - connectStart;
      testResults[1] = {
        step: "2. Network Connectivity",
        status: "failure",
        message: `Connection failed: ${error.message}`,
        details: { error: error.message },
        duration: Math.round(connectDuration),
      };
    }
    setResults([...testResults]);

    // Step 3: Login Request
    testResults.push({
      step: "3. Login Request",
      status: "pending",
      message: "Sending login credentials...",
    });
    setResults([...testResults]);

    const loginStart = performance.now();
    try {
      const response = await apiClient.post("/auth/login", {
        username: username.trim(),
        password: password,
      });

      const loginDuration = performance.now() - loginStart;

      if (response.status === 200 && response.data?.token) {
        const loginToken = response.data.token;
        setToken(loginToken);

        testResults[2] = {
          step: "3. Login Request",
          status: "success",
          message: `Login successful! Token received (${loginToken.length} characters)`,
          details: {
            statusCode: response.status,
            user: response.data.user,
            tokenPreview: `${loginToken.substring(0, 30)}...`,
          },
          duration: Math.round(loginDuration),
        };
      } else {
        testResults[2] = {
          step: "3. Login Request",
          status: "failure",
          message: "Login response missing token",
          details: { response: response.data },
          duration: Math.round(loginDuration),
        };
      }
    } catch (error: any) {
      const loginDuration = performance.now() - loginStart;
      const errorMsg = error.response?.data?.error?.message || error.message;
      const statusCode = error.response?.status;

      testResults[2] = {
        step: "3. Login Request",
        status: "failure",
        message: `Login failed: ${errorMsg} (Status: ${statusCode})`,
        details: {
          statusCode: statusCode,
          errorData: error.response?.data,
          headers: error.response?.headers,
        },
        duration: Math.round(loginDuration),
      };
    }
    setResults([...testResults]);

    // Step 4: Verify Token (if login succeeded)
    if (token) {
      testResults.push({
        step: "4. Verify Token",
        status: "pending",
        message: "Verifying token with /auth/session...",
      });
      setResults([...testResults]);

      const verifyStart = performance.now();
      try {
        const response = await apiClient.get("/auth/session", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const verifyDuration = performance.now() - verifyStart;

        if (response.status === 200) {
          testResults[3] = {
            step: "4. Verify Token",
            status: "success",
            message: `Token verified! User session valid`,
            details: {
              statusCode: response.status,
              user: response.data,
            },
            duration: Math.round(verifyDuration),
          };
        }
      } catch (error: any) {
        const verifyDuration = performance.now() - verifyStart;
        testResults[3] = {
          step: "4. Verify Token",
          status: "failure",
          message: `Token verification failed: ${error.message}`,
          details: { error: error.response?.data },
          duration: Math.round(verifyDuration),
        };
      }
      setResults([...testResults]);
    }

    setIsLoading(false);
  };

  const allPassed = results.every((r) => r.status === "success");
  const hasFailed = results.some((r) => r.status === "failure");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Login Test</h1>
        <p className="text-sm text-muted-foreground">
          Test the login endpoint to verify React app ↔ Oracle APEX communication
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Login Credentials</CardTitle>
          <CardDescription>Enter credentials to test the /auth/login endpoint</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin"
                disabled={isLoading}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button onClick={handleLoginTest} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? (
              <>
                <Loader className="mr-2 size-4 animate-spin" />
                Testing Login...
              </>
            ) : (
              "Test Login"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* API Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Base URL:</p>
            <p className="font-mono text-sm text-blue-600 break-all">
              {apiClient.defaults.baseURL}
            </p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Full Login Endpoint:</p>
            <p className="font-mono text-sm text-blue-600 break-all">
              {apiClient.defaults.baseURL}/auth/login
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {allPassed && results.length > 0 ? (
                <span className="text-green-600 font-semibold">✓ All steps passed!</span>
              ) : hasFailed ? (
                <span className="text-red-600 font-semibold">✗ Some steps failed</span>
              ) : (
                "Test in progress..."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {result.status === "success" && (
                        <CheckCircle className="size-5 text-green-600 flex-shrink-0" />
                      )}
                      {result.status === "failure" && (
                        <XCircle className="size-5 text-red-600 flex-shrink-0" />
                      )}
                      {result.status === "pending" && (
                        <Loader className="size-5 text-yellow-600 animate-spin flex-shrink-0" />
                      )}
                      <h4 className="font-semibold">{result.step}</h4>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
                  </div>
                  {result.duration && (
                    <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                      {result.duration}ms
                    </div>
                  )}
                </div>

                {result.details && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700">
                      View Details
                    </summary>
                    <div className="mt-2 rounded bg-slate-50 dark:bg-slate-950 p-3 max-h-48 overflow-auto">
                      <pre className="text-xs font-mono text-slate-700 dark:text-slate-300">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Token Display */}
      {token && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">✓ Login Successful!</CardTitle>
            <CardDescription className="text-green-700">Authentication token received</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-green-700 font-medium mb-1">Token (stored in localStorage):</p>
              <div className="rounded bg-white p-2 border border-green-200 break-all font-mono text-xs">
                {token}
              </div>
            </div>
            <p className="text-xs text-green-700">
              ✓ React app can now communicate with Oracle APEX!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting */}
      {hasFailed && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="size-5" />
              Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Check these:</h4>
              <ul className="space-y-1 text-red-800 text-xs">
                <li>✓ Oracle APEX instance is running and accessible</li>
                <li>✓ REST module "Content Platform API" is published in APEX</li>
                <li>✓ Template "/auth/login" exists in the module</li>
                <li>✓ Handler for POST /auth/login is configured</li>
                <li>✓ CORS is configured to allow your domain</li>
                <li>✓ Admin user exists in CREATORS table with password "admin"</li>
                <li>✓ auth_login procedure exists and is executable</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-red-900 mb-1">Open DevTools (F12):</h4>
              <ul className="space-y-1 text-red-800 text-xs">
                <li>• Network tab → Look for /auth/login request</li>
                <li>• Check Status code (should be 200)</li>
                <li>• Check Response body (should have user + token)</li>
                <li>• Check CORS headers in Response headers</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
