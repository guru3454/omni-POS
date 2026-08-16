import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Zap,
  Activity,
  FileCode,
  Download,
  X,
  AlertTriangle,
} from 'lucide-react';
import { TestSuiteRunner, TestCaseResult } from '../../services/testSuite';

interface TestSuiteModalProps {
  onClose?: () => void;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({ onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const handleRunAll = async () => {
    setIsRunning(true);
    // Add small delay for visual feedback
    await new Promise((r) => setTimeout(r, 400));
    const testResults = await TestSuiteRunner.runAllTests();
    setResults(testResults);
    setIsRunning(false);
    setHasRun(true);
  };

  const totalPass = results.filter((r) => r.passed).length;
  const totalFail = results.filter((r) => !r.passed).length;
  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0);

  return (
    <div className="flex flex-col h-full bg-[#F4F7F5] text-slate-800 p-4 space-y-3.5 overflow-hidden select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-black text-slate-900">Automated Verification & Integrity Test Suite</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Executes full-stack domain assertions covering fiscal tax calculations, multi-tenancy, inventory BOM, idempotency, hotel room folios, and security PIN RBAC.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {hasRun && (
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold">
                {totalPass} PASSED
              </span>
              {totalFail > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-800 font-bold">
                  {totalFail} FAILED
                </span>
              )}
              <span className="text-slate-500 font-medium">{totalDuration}ms</span>
            </div>
          )}

          <button
            onClick={handleRunAll}
            disabled={isRunning}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black rounded-xl text-xs transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
            <span>{isRunning ? 'EXECUTING ENGINE TESTS...' : 'RUN FULL TEST SUITE'}</span>
          </button>
        </div>
      </div>

      {/* Main Results Canvas */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 p-4 overflow-y-auto space-y-3 shadow-sm">
        {!hasRun && !isRunning ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center">
            <Activity className="w-12 h-12 text-slate-300 mb-3" />
            <div className="font-bold text-sm text-slate-700">Ready to Execute Automated Unit & Security Tests</div>
            <div className="text-xs mt-1 text-slate-400 max-w-md">
              Click &quot;RUN FULL TEST SUITE&quot; to execute real-time state machine transitions, tax formula validation, BOM deductions, and offline queue idempotency checks.
            </div>
          </div>
        ) : (
          results.map((test, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                test.passed
                  ? 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200/70">
                <div className="flex items-center space-x-2.5">
                  {test.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-emerald-700 font-bold">[{test.id}]</span>
                      <h3 className="font-black text-sm text-slate-900">{test.name}</h3>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      Category: {test.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
                  <span>{test.durationMs}ms</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      test.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {test.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>

              {/* Message / Diagnostic */}
              <div className="font-mono text-[11px] bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 shadow-2xs">
                {test.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

