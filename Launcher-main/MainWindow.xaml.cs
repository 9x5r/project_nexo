using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Resources;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Markup;
using System.Windows.Media;
using Microsoft.Win32;
using Wpf.Ui;
using Wpf.Ui.Appearance;
using Wpf.Ui.Controls;

namespace PlooshLauncher
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : FluentWindow
    {
        public MainWindow()
        {
            ApplicationThemeManager.ApplySystemTheme(true);
            InitializeComponent();
            pathText.Content = Settings.Default.path;
            if (pathText.Content as string != "") pathPlaceholder.Visibility = Visibility.Hidden;
            username.Text = Settings.Default.username;
            password.Password = Settings.Default.password;
            backend.Text = Settings.Default.backend;
            titleBar.Background = ApplicationAccentColorManager.SystemAccentBrush;
            bool isWindows10 = Environment.OSVersion.Version.Build < 22000;
            if (isWindows10)
            {
                WindowBackdropType = WindowBackdropType.None;
                Background = ApplicationAccentColorManager.SystemAccentBrush;
            }
        }

        private void setUsername(object sender, RoutedEventArgs e)
        {
            if (exchange.IsChecked == false)
            {
                Settings.Default.username = username.Text;
                Settings.Default.Save();
            }
        }

        private void setPassword(object sender, RoutedEventArgs e)
        {
            Settings.Default.password = password.Password;
            Settings.Default.Save();
        }

        private void setBackend(object sender, RoutedEventArgs e)
        {
            Settings.Default.backend = backend.Text;
            Settings.Default.Save();
        }

        private void selectFolder(object sender, RoutedEventArgs e)
        {
            OpenFolderDialog openFolderDialog = new OpenFolderDialog
            {
                Title = "Select Folder",
                InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86)
            };
            if (openFolderDialog.ShowDialog() == true)
            {
                pathText.Content = openFolderDialog.FolderName;
                if (pathText.Content as string != "") pathPlaceholder.Visibility = Visibility.Hidden;
                Settings.Default.path = pathText.Content.ToString()!;
                Settings.Default.Save();
            }
        }

        private void doExchange(object sender, RoutedEventArgs e)
        {
            password.Visibility = Visibility.Hidden;
            passwordLabel.Visibility = Visibility.Hidden;
            backend.Margin = new(0, -53, 0, 53);
            backendLabel.Margin = new(0, -53, 0, 53);
            exchange.Margin = new(0, -35, 0, 35);
            launch.Margin = new(0, 75, 0, 0);
            emailLabel.Text = "Exchange code";
            username.PlaceholderText = "Exchange code...";
            username.Text = "";
        }

        private void undoExchange(object sender, RoutedEventArgs e)
        {
            password.Visibility = Visibility.Visible;
            passwordLabel.Visibility = Visibility.Visible;
            backend.Margin = new(0, 0, 0, 0);
            backendLabel.Margin = new(0, 0, 0, 0);
            exchange.Margin = new(0, 25, 0, 0);
            launch.Margin = new(0, 50, 0, 0);
            emailLabel.Text = "Email";
            username.PlaceholderText = "Email...";
            username.Text = Settings.Default.username;
        }


        private async void launchGame(object sender, RoutedEventArgs e)
        {
            if (File.Exists(Path.Join(pathText.Content.ToString(), "FortniteGame", "Binaries", "Win64", "FortniteClient-Win64-Shipping.exe")))
            {
                launch.Content = "Launching...";
                launch.IsEnabled = false;
                Process.GetProcessesByName("FortniteClient-Win64-Shipping").ToList().ForEach(delegate (Process x)
                {
                    try
                    {
                        x.Kill();
                    }
                    catch { }
                });
                try
                {
                    ResourceManager rm = new ResourceManager("GalaxyLauncher.g", Assembly.GetExecutingAssembly());
                    Stream? manifestResourceStream = rm.GetStream("starfall.dll");
                    string tempFileName = Path.GetTempFileName();
                    FileStream fileStream = File.OpenWrite(tempFileName);
                    manifestResourceStream?.Seek(0L, SeekOrigin.Begin);
                    manifestResourceStream?.CopyTo(fileStream);
                    fileStream.Close();
                    File.Copy(tempFileName, Path.Join(pathText.Content.ToString(), "Engine", "Binaries", "ThirdParty", "NVIDIA", "NVaftermath", "Win64", "GFSDK_Aftermath_Lib.x64.dll"), overwrite: true);
                    File.Copy(tempFileName, Path.Join(pathText.Content.ToString(), "Engine", "Binaries", "ThirdParty", "NVIDIA", "NVaftermath", "Win64", "GFSDK_Aftermath_Lib.dll"), overwrite: true);
                    File.Delete(tempFileName);
                }
                catch
                {
                    return;
                }
                Process? FN = Proc.Start(pathText.Content.ToString()!, "FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe", $"-epicapp=Fortnite -epicenv=Prod -epiclocale=en-us -epicportal -nobe -fromfl=eac -fltoken=h1cdhchd10150221h130eB56 -skippatchcheck -caldera=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiMTM5ZDAzOGFmOTM2NDcyODgxMTdlYWU3MWYxZGQ5ZTQiLCJnZW5lcmF0ZWQiOjE3MDQ0MTE5MDQsImNhbGRlcmFHdWlkIjoiODhjZmQ5NzYtM2U2OS00MWYzLWI2ODEtYzQyOTcxM2ZkMWFlIiwiYWNQcm92aWRlciI6IkVhc3lBbnRpQ2hlYXQiLCJub3RlcyI6IiIsImZhbGxiYWNrIjpmYWxzZX0.Q8hdxvrW2sH-3on6JEBLANB0rkPAGUwbZYPrCOMTtvA -AUTH_LOGIN={(exchange.IsChecked == true ? "unused" : username.Text)} -AUTH_PASSWORD={(exchange.IsChecked == true ? username.Text : password.Password)} -AUTH_TYPE={(exchange.IsChecked == true ? "exchangecode" : "epic")} -backend={backend.Text}");
                Process? AC = Proc.Start(pathText.Content.ToString()!, "FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping_EAC.exe", "-epicapp=Fortnite -epicenv=Prod -epiclocale=en-us -epicportal -nobe -fromfl=eac -fltoken=h1cdhchd10150221h130eB56 -skippatchcheck", suspend: true);
                Process? LC = Proc.Start(pathText.Content.ToString()!, "FortniteGame\\Binaries\\Win64\\FortniteLauncher.exe", "-epicapp=Fortnite -epicenv=Prod -epiclocale=en-us -epicportal -nobe -fromfl=eac -fltoken=h1cdhchd10150221h130eB56 -skippatchcheck", suspend: true);
                launch.Content = "Loading...";
                await Task.Run(() => FN!.WaitForInputIdle());
                launch.Content = "Running";
                await FN!.WaitForExitAsync();
                try
                {
                    AC!.Kill();
                    LC!.Kill();
                }
                catch
                {
                }
                launch.Content = "Launch FN";
                launch.IsEnabled = true;
            }
        }
    }
}