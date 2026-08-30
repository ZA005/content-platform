import { useState } from "react";
import { Loader, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiTester, type TestResult } from "@/infrastructure/api/api-tester";

export function APIDiagnosticPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const handleRunTests = async () => {
    setIsRunning(true);
    setResults([]);
    setLogs([]);

    // Capture console output
    const originalLog = console.log;
    const originalError = console.error;
    const allLogs: string[] = [];

    console.log = (...args: any[]) => {
      const message = args.map((arg) => String(arg)).join(" ");
      allLogs.push(message);
      originalLog(...args);
    };

    console.error = (...args: any[]) => {
      const message = `ERROR: ${args.map((arg) => String(arg)).join(" ")}`;
      allLogs.push(message);
      originalError(...args);
    };

    try {
      const testResults = await apiTester.runAllTests();
      setResults(testResults);
      setLogs(allLogs);
      apiTester.printSummary();
    } catch (error: any) {
      allLogs.push(`Fatal error: ${error.message}`);
      setLogs(allLogs);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      setIsRunning(false);
    }
  };

  const passed = results.filter((r) => r.status === "success").length;
  const failed = results.filter((r) => r.status === "failure").length;
  const total = results.length;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">API Diagnostic Tool</h1>
        <p className="text-sm text-muted-foreground">
          Test the Oracle APEX API connection and endpoints
        </p>
      </div>

      {/* Control Section */}
      <Card>
        <CardHeader>
          <CardTitle>Test Suite</CardTitle>
          <CardDescription>Run automated tests to verify API connectivity and functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-mono">
              API URL: <span className="text-blue-600">https://oracleapex.com/ords/expplayground/platform/api</span>
            </p>
          </div>
          <Button onClick={handleRunTests} disabled={isRunning} size="lg">
            {isRunning ? (
              <>
                <Loader className="mr-2 size-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              "Run API Tests"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-700">Passed</p>
                <p className="text-2xl font-bold text-green-700">{passed}</p>
              </div>
              <div className={`rounded-lg border p-4 ${failed > 0 ? "border-red-200 bg-red-50" : ""}`}>
                <p className={`text-sm font-medium ${failed > 0 ? "text-red-700" : ""}`}>Failed</p>
                <p className={`text-2xl font-bold ${failed > 0 ? "text-red-700" : ""}`}>{failed}</p>
              </div>
            </div>

            {/* Status Message */}
            <div className="mt-4">
              {failed === 0 && passed > 0 ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700">
                  <CheckCircle className="size-5" />
                  <span className="font-medium">All tests passed! API is working correctly.</span>
                </div>
              ) : failed > 0 ? (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700">
                  <XCircle className="size-5" />
                  <span className="font-medium">
                    {failed} test(s) failed. Check details below and review the Oracle APEX configuration.
                  </span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {result.status === "success" ? (
                          <CheckCircle className="size-5 text-green-600" />
                        ) : (
                          <XCircle className="size-5 text-red-600" />
                        )}
                        <h4 className="font-semibold">{result.name}</h4>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {result.statusCode && <p>Status: {result.statusCode}</p>}
                      <p>{result.duration}ms</p>
                    </div>
                  </div>

                  {result.error && (
                    <div className="mt-2 rounded bg-red-50 p-2">
                      <p className="text-xs font-mono text-red-700">{result.error}</p>
                    </div>
                  )}

                  {result.response && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium text-blue-600">
                        View Response
                      </summary>
                      <div className="mt-2 max-h-48 overflow-auto rounded bg-slate-50 p-2">
                        <pre className="text-xs">
                          {JSON.stringify(result.response, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Console Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Console Output</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto rounded-lg bg-slate-950 p-4">
              <pre className="font-mono text-xs text-slate-200">
                {logs.join("\n")}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="size-5" />
            Troubleshooting Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold">Connection Refused / Timeout</h4>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• Check if Oracle APEX instance is running</li>
              <li>• Verify the API URL is correct</li>
              <li>• Check firewall rules allow access to the server</li>
              <li>• Ensure CORS is configured in Oracle APEX</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">403 Forbidden</h4>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• Check CORS configuration in Oracle APEX</li>
              <li>• Verify frontend origin is in allowed list</li>
              <li>• Ensure APEX REST modules are published</li>
              <li>• Check module authentication settings</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Invalid Credentials (Login Failed)</h4>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• Verify admin user exists in CREATORS table</li>
              <li>• Check password matches database</li>
              <li>• Ensure auth_login procedure exists</li>
              <li>• Review APEX error logs</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Schema/Procedure Errors</h4>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• Run schema creation script from APEX_PLSQL_SCRIPTS.md</li>
              <li>• Verify all procedures are created</li>
              <li>• Grant EXECUTE permissions to APEX_PUBLIC_USER</li>
              <li>• Check procedure parameters match REST handler calls</li>
            </ul>
          </div>

          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Open browser DevTools (F12) → Network tab to see detailed request/response information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
