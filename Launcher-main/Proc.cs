using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;

namespace PlooshLauncher
{
    internal static class Proc
    {
        [DllImport("kernel32.dll")]
        private static extern nint OpenThread(int dwDesiredAccess, bool bInheritHandle, uint dwThreadId);

        [DllImport("kernel32.dll")]
        private static extern uint SuspendThread(nint hThread);

        public static void Suspend(this Process process)
        {
            foreach (ProcessThread thread in process.Threads)
            {
                nint num = OpenThread(2, bInheritHandle: false, (uint)thread.Id);
                if (num == IntPtr.Zero)
                {
                    break;
                }
                SuspendThread(num);
            }
        }

        public static Process? Start(string Base, string path, string args = "", bool suspend = false)
        {
            if (!File.Exists(Path.Combine(Base, path)))
            {
                return null;
            }
            Process? process = Process.Start(new ProcessStartInfo
            {
                FileName = Path.Combine(Base, path),
                Arguments = args,
                CreateNoWindow = true,
                UseShellExecute = false
            });
            if (process == null)
            {
                return null;
            }
            if (suspend)
            {
                process.Suspend();
            }
            return process;
        }
    }
}
