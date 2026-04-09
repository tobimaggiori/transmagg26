VERSION 5.00
Object = "{3C62B3DD-12BE-4941-A787-EA25415DCD27}#10.0#0"; "crviewer.dll"
Begin VB.Form InfMutuo 
   Caption         =   "Mutuo"
   ClientHeight    =   5070
   ClientLeft      =   120
   ClientTop       =   450
   ClientWidth     =   10350
   LinkTopic       =   "Form1"
   ScaleHeight     =   5070
   ScaleWidth      =   10350
   StartUpPosition =   3  'Windows Default
   Begin CrystalActiveXReportViewerLib10Ctl.CrystalActiveXReportViewer Vista 
      Height          =   4935
      Left            =   0
      TabIndex        =   0
      Top             =   0
      Width           =   10215
      lastProp        =   600
      _cx             =   18018
      _cy             =   8705
      DisplayGroupTree=   -1  'True
      DisplayToolbar  =   -1  'True
      EnableGroupTree =   -1  'True
      EnableNavigationControls=   -1  'True
      EnableStopButton=   -1  'True
      EnablePrintButton=   -1  'True
      EnableZoomControl=   -1  'True
      EnableCloseButton=   -1  'True
      EnableProgressControl=   -1  'True
      EnableSearchControl=   -1  'True
      EnableRefreshButton=   -1  'True
      EnableDrillDown =   -1  'True
      EnableAnimationControl=   -1  'True
      EnableSelectExpertButton=   0   'False
      EnableToolbar   =   -1  'True
      DisplayBorder   =   -1  'True
      DisplayTabs     =   -1  'True
      DisplayBackgroundEdge=   -1  'True
      SelectionFormula=   ""
      EnablePopupMenu =   -1  'True
      EnableExportButton=   0   'False
      EnableSearchExpertButton=   0   'False
      EnableHelpButton=   0   'False
      LaunchHTTPHyperlinksInNewBrowser=   -1  'True
      EnableLogonPrompts=   -1  'True
   End
End
Attribute VB_Name = "InfMutuo"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit
Private crapp As New CRAXDRT.Application
Private crReporte As New CRAXDRT.Report
Private DBTabl As CRAXDRT.DatabaseTable
Private DBTabl1 As CRAXDRT.DatabaseTable
Private Sub Form_Load()
Me.Height = 6915
Me.Width = 9885
Me.Top = (Screen.Height - Me.Height) / 2
Me.Left = (Screen.Width - Me.Width) / 2
Screen.MousePointer = vbHourglass
Set rsEncabOP = db.OpenRecordset("Select * From EncabMuto Where Nro = " & VNROOP & "")
Set crReporte = crapp.OpenReport(App.Path & "\OP.rpt", 1)
Set DBTabl = crReporte.Database.Tables(1)
DBTabl.Location = App.Path & "\BaseDatos\DB_TRANS-MAGG.mdb"
DBTabl.SetDataSource rsEncabOP
Vista.ReportSource = crReporte
Vista.DisplayGroupTree = False
Vista.ViewReport
Screen.MousePointer = vbDefault
End Sub

Private Sub Form_Resize()
Vista.Top = 0
Vista.Left = 0
Vista.Height = ScaleHeight
Vista.Width = ScaleWidth
End Sub


