VERSION 5.00
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{FF19AA0C-2968-41B8-A906-E80997A9C394}#253.0#0"; "WSAFIPFEOCX.ocx"
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form GeneraCAE 
   Caption         =   "Generar CAE"
   ClientHeight    =   4650
   ClientLeft      =   120
   ClientTop       =   450
   ClientWidth     =   12900
   ClipControls    =   0   'False
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   4650
   ScaleWidth      =   12900
   Begin VB.CheckBox Check1 
      Caption         =   "Tildar / Destildar TODOS"
      Height          =   375
      Left            =   10680
      TabIndex        =   12
      Top             =   120
      Width           =   2055
   End
   Begin WSAFIPFEOCX.WSAFIPFEx FE 
      Left            =   9600
      Top             =   600
      _ExtentX        =   1720
      _ExtentY        =   661
   End
   Begin VB.CommandButton Command2 
      Caption         =   "Imprimir"
      Height          =   375
      Left            =   2520
      TabIndex        =   11
      Top             =   4080
      Width           =   2055
   End
   Begin VB.CommandButton Command1 
      Caption         =   "Generar CAE"
      Height          =   375
      Left            =   240
      TabIndex        =   10
      Top             =   4080
      Width           =   2055
   End
   Begin VB.TextBox PtoVta 
      Height          =   375
      Left            =   1560
      TabIndex        =   9
      Top             =   600
      Width           =   1455
   End
   Begin MSMask.MaskEdBox Desde 
      Height          =   375
      Left            =   1440
      TabIndex        =   6
      Top             =   120
      Width           =   2175
      _ExtentX        =   3836
      _ExtentY        =   661
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.CommandButton Buscar 
      Caption         =   "Buscar"
      Height          =   375
      Left            =   7920
      TabIndex        =   2
      Top             =   120
      Width           =   2055
   End
   Begin MSComctlLib.ListView Comprobantes 
      Height          =   2655
      Left            =   120
      TabIndex        =   1
      Top             =   1320
      Width           =   12615
      _ExtentX        =   22251
      _ExtentY        =   4683
      View            =   3
      LabelWrap       =   0   'False
      HideSelection   =   0   'False
      Checkboxes      =   -1  'True
      FullRowSelect   =   -1  'True
      GridLines       =   -1  'True
      _Version        =   393217
      ForeColor       =   -2147483640
      BackColor       =   -2147483643
      BorderStyle     =   1
      Appearance      =   1
      NumItems        =   13
      BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         Text            =   "Fecha"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   1
         Text            =   "Pto Vta "
         Object.Width           =   882
      EndProperty
      BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   2
         Text            =   "Numero"
         Object.Width           =   2469
      EndProperty
      BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   3
         Text            =   "Empresa"
         Object.Width           =   5292
      EndProperty
      BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   4
         Text            =   "Neto"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   5
         Text            =   "IVA"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   6
         Text            =   "SubTotal"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   7
         Text            =   "CAE"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(9) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   8
         Text            =   "TipoCompAsoc"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(10) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   9
         Text            =   "PtoVta_Asoc"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(11) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   10
         Text            =   "NroComp_Asoc"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(12) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   11
         Text            =   "Fecha_Asoc"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(13) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   12
         Text            =   "Motivo_Asoc"
         Object.Width           =   2540
      EndProperty
   End
   Begin VB.ComboBox Comp 
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   360
      Left            =   5160
      TabIndex        =   0
      Top             =   600
      Width           =   4335
   End
   Begin MSMask.MaskEdBox Hasta 
      Height          =   375
      Left            =   5040
      TabIndex        =   7
      Top             =   120
      Width           =   2175
      _ExtentX        =   3836
      _ExtentY        =   661
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.Label Label1 
      Caption         =   "Punto de Vta:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   375
      Index           =   3
      Left            =   120
      TabIndex        =   8
      Top             =   720
      Width           =   2055
   End
   Begin VB.Label Label1 
      Caption         =   "Hasta"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   375
      Index           =   1
      Left            =   3840
      TabIndex        =   5
      Top             =   120
      Width           =   2055
   End
   Begin VB.Label Label1 
      Caption         =   "Desde"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   375
      Index           =   0
      Left            =   120
      TabIndex        =   4
      Top             =   120
      Width           =   2055
   End
   Begin VB.Label Label1 
      Caption         =   "Comprobante"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   375
      Index           =   2
      Left            =   3120
      TabIndex        =   3
      Top             =   600
      Width           =   2055
   End
End
Attribute VB_Name = "GeneraCAE"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit
Dim UltNro As String, FVto As String, FServD As String, FservH As String, FPago As String, VNetoFE As Double
Dim VivaFE As Double, FCte As String, VCUIT As String, VTipoDoc As Single, VIndice As Long, VtipoComp, lResultado As Boolean
Dim VCAE As String, VMOTIVO As String, VProceso As String, VNro As String, ErrorCAE As String, VRuta As String, i As Integer, II As Integer, A As Integer
Dim DIGITO As String, VTOTAL As String
Private crapp As New CRAXDRT.Application
Private crReporte As New CRAXDRT.Report
Private DBTabl As CRAXDRT.DatabaseTable
Dim DIA As String, MES As String, AÑO As String, FVTOCAE As String, largo As Double, NRO As String
Dim Registros As Integer, Impletra As Stream



Private Sub Buscar_Click()
On Error Resume Next
Comprobantes.ListItems.Clear
Select Case Comp.ListIndex
    Case 0:
        Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where FechaFE BETWEEN # " + Format(Desde, "mm/dd/yyyy") + " # AND # " + Format(Hasta, "mm/dd/yyyy") + " # AND PtoVtaFE = " & PtoVta & " and TipoSistema = 16 ORDER BY NroFE")
        Do While Not rsEncabFact.EOF
            Set Lista = Comprobantes.ListItems.Add(, , rsEncabFact!FechaFE)
            Lista.Tag = rsEncabFact!FechaFE
            If IsNull(rsEncabFact!CAE) Then
                Lista.Checked = True
            Else
                Lista.Checked = False
            End If
            Lista.SubItems(1) = rsEncabFact!PtoVtaFE
            Lista.SubItems(2) = rsEncabFact!NroFE
            Set rsEmpresas = db.OpenRecordset("Select * FRom Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
            Lista.SubItems(3) = rsEmpresas!DescEmpresas
            Lista.SubItems(4) = FormatNumber(rsEncabFact!TotalNetofe)
            Lista.SubItems(5) = FormatNumber(rsEncabFact!TotalIVAFE)
            Lista.SubItems(6) = FormatNumber(rsEncabFact!totalgralfe)
            Lista.SubItems(7) = rsEncabFact!CAE
            rsEncabFact.MoveNext
        Loop
    Case 2:
        Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where FechaFE BETWEEN # " + Format(Desde, "mm/dd/yyyy") + " # AND # " + Format(Hasta, "mm/dd/yyyy") + " # AND PtoVtaFE = " & PtoVta & " and TipoSistema = 18 ORDER BY NroFE")
        Do While Not rsEncabFact.EOF
            Set Lista = Comprobantes.ListItems.Add(, , rsEncabFact!FechaFE)
            Lista.Tag = rsEncabFact!FechaFE
            If IsNull(rsEncabFact!CAE) Then
                Lista.Checked = True
            Else
                Lista.Checked = False
            End If
            Lista.SubItems(1) = rsEncabFact!PtoVtaFE
            Lista.SubItems(2) = rsEncabFact!NroFE
            If rsEncabFact!Emp_Flet = 0 Then
                Set rsEmpresas = db.OpenRecordset("Select * FRom Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
                Lista.SubItems(3) = rsEmpresas!DescEmpresas
            Else
                Set rsEmpresas = db.OpenRecordset("Select * FRom Fleteros Where CodFlet = " & rsEncabFact!CodClie & "")
                Lista.SubItems(3) = rsEmpresas!DescFlet
            End If
            
            Lista.SubItems(4) = FormatNumber(rsEncabFact!TotalNetofe)
            Lista.SubItems(5) = FormatNumber(rsEncabFact!TotalIVAFE)
            Lista.SubItems(6) = FormatNumber(rsEncabFact!totalgralfe)
            Lista.SubItems(7) = rsEncabFact!CAE
            Lista.SubItems(8) = rsEncabFact!TipoComp_Asoc
            Lista.SubItems(9) = rsEncabFact!PtoVta_Asoc
            Lista.SubItems(10) = rsEncabFact!Nro_Asoc
            Lista.SubItems(11) = rsEncabFact!Fecha_Asoc
            Lista.SubItems(12) = rsEncabFact!Motivo_Asoc
            rsEncabFact.MoveNext
        Loop
    Case 1:
        Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where FechaFE BETWEEN # " + Format(Desde, "mm/dd/yyyy") + " # AND # " + Format(Hasta, "mm/dd/yyyy") + " # AND PtoVtaFE = " & PtoVta & " and TipoSistema = 17 ORDER BY NroFE")
        Do While Not rsEncabFact.EOF
            Set Lista = Comprobantes.ListItems.Add(, , rsEncabFact!FechaFE)
            Lista.Tag = rsEncabFact!FechaFE
            If IsNull(rsEncabFact!CAE) Then
                Lista.Checked = True
            Else
                Lista.Checked = False
            End If
            Lista.SubItems(1) = rsEncabFact!PtoVtaFE
            Lista.SubItems(2) = rsEncabFact!NroFE
            If rsEncabFact!Emp_Flet = 1 Or IsNull(rsEncabFact!Emp_Flet) Then
            Set rsEmpresas = db.OpenRecordset("Select * FRom Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
            Lista.SubItems(3) = rsEmpresas!DescEmpresas
            Else
            Set rsEmpresas = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!CodClie & "")
            Lista.SubItems(3) = rsEmpresas!DescFlet
            End If
            Lista.SubItems(4) = FormatNumber(rsEncabFact!TotalNetofe)
            
            Lista.SubItems(5) = FormatNumber(rsEncabFact!TotalIVAFE)
            Lista.SubItems(6) = FormatNumber(rsEncabFact!totalgralfe)
            Lista.SubItems(7) = rsEncabFact!CAE
            Lista.SubItems(8) = rsEncabFact!TipoComp_Asoc
            Lista.SubItems(9) = rsEncabFact!PtoVta_Asoc
            Lista.SubItems(10) = rsEncabFact!Nro_Asoc
            Lista.SubItems(11) = rsEncabFact!Fecha_Asoc
            Lista.SubItems(12) = rsEncabFact!Motivo_Asoc
            rsEncabFact.MoveNext
        Loop
    Case 3:
        Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where FechaFE BETWEEN # " + Format(Desde, "mm/dd/yyyy") + " # AND # " + Format(Hasta, "mm/dd/yyyy") + " # AND PtoVtaFE = " & PtoVta & " and TipoSistema = 201 ORDER BY NroFE")
        Do While Not rsEncabFact.EOF
            Set Lista = Comprobantes.ListItems.Add(, , rsEncabFact!FechaFE)
            Lista.Tag = rsEncabFact!FechaFE
            If IsNull(rsEncabFact!CAE) Then
                Lista.Checked = True
            Else
                Lista.Checked = False
            End If
            Lista.SubItems(1) = rsEncabFact!PtoVtaFE
            Lista.SubItems(2) = rsEncabFact!NroFE
            If Not rsEncabFact!Emp_Flet = 1 Or Not IsNull(rsEncabFact!Emp_Flet) Then
            Set rsEmpresas = db.OpenRecordset("Select * FRom Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
            Lista.SubItems(3) = rsEmpresas!DescEmpresas
            End If
            Lista.SubItems(4) = FormatNumber(rsEncabFact!TotalNetofe)
            Lista.SubItems(5) = FormatNumber(rsEncabFact!TotalIVAFE)
            Lista.SubItems(6) = FormatNumber(rsEncabFact!totalgralfe)
            Lista.SubItems(7) = rsEncabFact!CAE
            rsEncabFact.MoveNext
        Loop
    Case 4:
        Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where FechaFE BETWEEN # " + Format(Desde, "mm/dd/yyyy") + " # AND # " + Format(Hasta, "mm/dd/yyyy") + " # AND PtoVtaFE = " & PtoVta & " and TipoSistema = 203 ORDER BY NroFE")
        Do While Not rsEncabFact.EOF
            Set Lista = Comprobantes.ListItems.Add(, , rsEncabFact!FechaFE)
            Lista.Tag = rsEncabFact!FechaFE
            If IsNull(rsEncabFact!CAE) Then
                Lista.Checked = True
            Else
                Lista.Checked = False
            End If
            Lista.SubItems(1) = rsEncabFact!PtoVtaFE
            Lista.SubItems(2) = rsEncabFact!NroFE
            If Not rsEncabFact!Emp_Flet = 1 Or Not IsNull(rsEncabFact!Emp_Flet) Then
            Set rsEmpresas = db.OpenRecordset("Select * FRom Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
            Lista.SubItems(3) = rsEmpresas!DescEmpresas
            End If
            Lista.SubItems(4) = FormatNumber(rsEncabFact!TotalNetofe)
            Lista.SubItems(5) = FormatNumber(rsEncabFact!TotalIVAFE)
            Lista.SubItems(6) = FormatNumber(rsEncabFact!totalgralfe)
            Lista.SubItems(7) = rsEncabFact!CAE
            Lista.SubItems(8) = rsEncabFact!TipoComp_Asoc
            Lista.SubItems(9) = rsEncabFact!PtoVta_Asoc
            Lista.SubItems(10) = rsEncabFact!Nro_Asoc
            Lista.SubItems(11) = rsEncabFact!Fecha_Asoc
            Lista.SubItems(12) = rsEncabFact!Motivo_Asoc
            rsEncabFact.MoveNext
        Loop
    Case 5:
        Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where FechaFE BETWEEN # " + Format(Desde, "mm/dd/yyyy") + " # AND # " + Format(Hasta, "mm/dd/yyyy") + " # AND PtoVtaFE = " & PtoVta & " and TipoSistema = 202 ORDER BY NroFE")
        Do While Not rsEncabFact.EOF
            Set Lista = Comprobantes.ListItems.Add(, , rsEncabFact!FechaFE)
            Lista.Tag = rsEncabFact!FechaFE
            If IsNull(rsEncabFact!CAE) Then
                Lista.Checked = True
            Else
                Lista.Checked = False
            End If
            Lista.SubItems(1) = rsEncabFact!PtoVtaFE
            Lista.SubItems(2) = rsEncabFact!NroFE
            If Not rsEncabFact!Emp_Flet = 1 Or Not IsNull(rsEncabFact!Emp_Flet) Then
            Set rsEmpresas = db.OpenRecordset("Select * FRom Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
            Lista.SubItems(3) = rsEmpresas!DescEmpresas
            End If
            Lista.SubItems(4) = FormatNumber(rsEncabFact!TotalNetofe)
            Lista.SubItems(5) = FormatNumber(rsEncabFact!TotalIVAFE)
            Lista.SubItems(6) = FormatNumber(rsEncabFact!totalgralfe)
            Lista.SubItems(7) = rsEncabFact!CAE
            rsEncabFact.MoveNext
        Loop
     Case 6:
        Set rsEncabFact = db.OpenRecordset("Select * From EncabLProd Where Fecha BETWEEN # " + Format(Desde, "mm/dd/yyyy") + " # AND # " + Format(Hasta, "mm/dd/yyyy") + " # AND PtoVta = " & PtoVta & " ORDER BY NroComp")
        Do While Not rsEncabFact.EOF
            Set Lista = Comprobantes.ListItems.Add(, , rsEncabFact!Fecha)
            Lista.Tag = rsEncabFact!Fecha
            If IsNull(rsEncabFact!CAE) Then
                Lista.Checked = True
            Else
                Lista.Checked = False
            End If
            Lista.SubItems(1) = rsEncabFact!PtoVta
            Lista.SubItems(2) = rsEncabFact!NroComp
            Set rsFleteros = db.OpenRecordset("Select * FRom Fleteros Where CodFlet = " & rsEncabFact!codflet & "")
            Lista.SubItems(3) = rsFleteros!DescFlet
            Lista.SubItems(4) = rsEncabFact!netoviajes
            Lista.SubItems(5) = rsEncabFact!ivaviaje
            Lista.SubItems(6) = rsEncabFact!totalviajeS1
            Lista.SubItems(7) = rsEncabFact!CAE
            rsEncabFact.MoveNext
        Loop
    Case 8:
        Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where FechaFE BETWEEN # " + Format(Desde, "mm/dd/yyyy") + " # AND # " + Format(Hasta, "mm/dd/yyyy") + " # AND PtoVtaFE = " & PtoVta & " and TipoSistema = 90 ORDER BY NroFE")
        Do While Not rsEncabFact.EOF
            Set Lista = Comprobantes.ListItems.Add(, , rsEncabFact!FechaFE)
            Lista.Tag = rsEncabFact!FechaFE
            If IsNull(rsEncabFact!CAE) Then
                Lista.Checked = True
            Else
                Lista.Checked = False
            End If
            Lista.SubItems(1) = rsEncabFact!PtoVtaFE
            Lista.SubItems(2) = rsEncabFact!NroFE
            If Not rsEncabFact!Emp_Flet = 1 Or Not IsNull(rsEncabFact!Emp_Flet) Then
            Set rsEmpresas = db.OpenRecordset("Select * FRom Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
            Lista.SubItems(3) = rsEmpresas!DescEmpresas
            End If
            Lista.SubItems(4) = FormatNumber(rsEncabFact!TotalNetofe)
            Lista.SubItems(5) = FormatNumber(rsEncabFact!TotalIVAFE)
            Lista.SubItems(6) = FormatNumber(rsEncabFact!totalgralfe)
            Lista.SubItems(7) = rsEncabFact!CAE
            rsEncabFact.MoveNext
        Loop
    Case 7:
        Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where FechaFE BETWEEN # " + Format(Desde, "mm/dd/yyyy") + " # AND # " + Format(Hasta, "mm/dd/yyyy") + " # AND PtoVtaFE = " & PtoVta & " and TipoSistema = 19 ORDER BY NroFE")
        Do While Not rsEncabFact.EOF
            Set Lista = Comprobantes.ListItems.Add(, , rsEncabFact!FechaFE)
            Lista.Tag = rsEncabFact!FechaFE
            If IsNull(rsEncabFact!CAE) Then
                Lista.Checked = True
            Else
                Lista.Checked = False
            End If
            Lista.SubItems(1) = rsEncabFact!PtoVtaFE
            Lista.SubItems(2) = rsEncabFact!NroFE
            If Not rsEncabFact!Emp_Flet = 1 Or Not IsNull(rsEncabFact!Emp_Flet) Then
            Set rsEmpresas = db.OpenRecordset("Select * FRom Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
            Lista.SubItems(3) = rsEmpresas!DescEmpresas
            End If
            Lista.SubItems(4) = FormatNumber(rsEncabFact!TotalNetofe)
            Lista.SubItems(5) = FormatNumber(rsEncabFact!TotalIVAFE)
            Lista.SubItems(6) = FormatNumber(rsEncabFact!totalgralfe)
            Lista.SubItems(7) = rsEncabFact!CAE
            rsEncabFact.MoveNext
        Loop
End Select
End Sub

Private Sub Check1_Click()
II = 0
If Check1.Value = 1 Then
    Registros = Comprobantes.ListItems.Count
        II = 0
        For II = II + 1 To Registros
               Set Lista = Comprobantes.ListItems.Item(II)
                Lista.Checked = True
            
        Next
Else
    Registros = Comprobantes.ListItems.Count
    II = 0
        For II = II + 1 To Registros
               Set Lista = Comprobantes.ListItems.Item(II)
                Lista.Checked = False
            
        Next
End If
End Sub

Private Sub Command1_Click()
On Error Resume Next
ErrorCAE = ""
Dim III As Integer
       Registros = Comprobantes.ListItems.Count
        II = 0
        For II = II + 1 To Registros
            If ErrorCAE = "" Then
                Set Lista = Comprobantes.ListItems.Item(II)
              
                If Lista.Checked = True Then
                    Call GeneraCAE_FE
                   ErrorCAE = ""
                   Lista.Checked = False
                End If
            Else
                'Exit Sub
            End If
        Next

        
End Sub
Private Sub GeneraCAE_FE()
On Error Resume Next
Dim VTipoSistema As Integer
If Not FE.f1TicketEsValido = True Then
    If FE.iniciar(modoFiscal_Fiscal, "30709381683", App.Path + "\Certificado\Certificado.pfx", App.Path + "\Certificado\WSAFIPFE.lic") Then
        FE.ArchivoCertificadoPassword = "hercasa1509"
        If FE.f1ObtenerTicketAcceso() Then
        Else
            MsgBox ("fallo acceso " + FE.UltimoMensajeError)
            Exit Sub
            
        End If
    Else
        MsgBox ("fallo iniciar " + FE.UltimoMensajeError)
        Exit Sub
    End If
End If

        'completa variables
        If Comp.ListIndex = 0 Then
            VTipoSistema = 16
            VtipoComp = 1
        ElseIf Comp.ListIndex = 1 Then
            VTipoSistema = 17
            VtipoComp = 3
        ElseIf Comp.ListIndex = 2 Then
            VTipoSistema = 18
            VtipoComp = 2
        ElseIf Comp.ListIndex = 3 Then
            VTipoSistema = 201
            VtipoComp = 201
        ElseIf Comp.ListIndex = 4 Then
            VTipoSistema = 203
            VtipoComp = 203
        ElseIf Comp.ListIndex = 5 Then
            VTipoSistema = 202
            VtipoComp = 202
        ElseIf Comp.ListIndex = 6 Then
            VTipoSistema = 60
            VtipoComp = 60
        ElseIf Comp.ListIndex = 8 Then
            VTipoSistema = 90
            VtipoComp = 90
        Else
            VTipoSistema = 19
            VtipoComp = 6
        End If
        If VTipoSistema = 60 Then
            Set rsEncabFact = db.OpenRecordset("Select * From EncabLProd Where NroComp = " & Lista.SubItems(2) & " AND PtoVta = " & Lista.SubItems(1) & "")
            Set rsEmpresas = db.OpenRecordset("SELECT * FROM Fleteros WHERE CodFlet = " & rsEncabFact!codflet & "")
        Else
            Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where NroFE = " & Lista.SubItems(2) & " And PtoVtaFE = " & Lista.SubItems(1) & " and TipoSistema = " & VTipoSistema & "")
            If rsEncabFact!ClaseFact = 5 Then
                Set rsEmpresas = db.OpenRecordset("SELECT * FROM Fleteros WHERE Codflet = " & rsEncabFact!CodClie & "")
            Else
                Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas WHERE CodEmpresas = " & rsEncabFact!CodClie & "")
            End If
        End If
        With rsEncabFact
        FVto = .Fields("FVto")
        FServD = .Fields("FServd")
        FservH = .Fields("FServH")
        FPago = .Fields("FPAgo")
        End With
        VNetoFE = FormatNumber(Lista.SubItems(4))
        VivaFE = FormatNumber(Lista.SubItems(5))
        FCte = Mid(Lista.Tag, 7, 4) & Mid(Lista.Tag, 4, 2) & Mid(Lista.Tag, 1, 2)
        
        VCUIT = Mid(rsEmpresas!cuit, 1, 2) & Mid(rsEmpresas!cuit, 4, 8) & Mid(rsEmpresas!cuit, 13, 1)
        VTipoDoc = 80
        
        VNro = Lista.SubItems(2)
        NroQR = Lista.SubItems(2)
        TFact = Lista.SubItems(6)
        VNetoFE = Lista.SubItems(4)
        TIVAFact = Lista.SubItems(5)

        FE.F1CabeceraCantReg = 1
        FE.F1CabeceraPtoVta = Lista.SubItems(1)
        FE.F1CabeceraCbteTipo = VtipoComp

        FE.f1Indice = 0
        FE.F1DetalleConcepto = 2
        FE.F1DetalleDocTipo = VTipoDoc
        FE.F1DetalleDocNro = VCUIT
        FE.F1DetalleCbteDesde = VNro
        FE.F1DetalleCbteHasta = VNro
        FE.F1DetalleCbteFch = FCte
        FE.F1DetalleImpTotal = FormatNumber(TFact)
        FE.F1DetalleImpTotalConc = 0
        FE.F1DetalleImpNeto = FormatNumber(VNetoFE)
        FE.F1DetalleImpOpEx = 0
        FE.F1DetalleImpTrib = 0
        FE.F1DetalleImpIva = FormatNumber(TIVAFact)
        FE.F1DetalleFchServDesde = FServD
        FE.F1DetalleFchServHasta = FservH
        If Not VTipoSistema = 203 Then
            FE.F1DetalleFchVtoPago = FPago
        End If
        FE.F1DetalleMonIdS = "PES"
        FE.F1DetalleMonCotiz = 1
        FE.F1DetalleIvaItemCantidad = 1
        FE.f1IndiceItem = 0
        If TIVAFact = 0 Then
            FE.F1DetalleIvaId = 3
        Else
            FE.F1DetalleIvaId = 5
        End If
        FE.F1DetalleIvaBaseImp = FormatNumber(VNetoFE)
        FE.F1DetalleIvaImporte = FormatNumber(TIVAFact)
        FE.ArchivoXMLRecibido = App.Path + "\XML\recibido.xml"
        FE.ArchivoXMLEnviado = App.Path + "\XML\enviado.xml"

        If VTipoSistema = 16 Or VTipoSistema = 60 Then
            FE.F1DetalleCbtesAsocItemCantidad = 0
            FE.F1DetalleOpcionalItemCantidad = 0
            
        ElseIf VTipoSistema = 201 Then
            FE.F1DetalleOpcionalItemCantidad = 2
            FE.f1IndiceItem = 0
            FE.F1DetalleOpcionalId = 2101
            FE.F1DetalleOpcionalValor = "3300043310430002552086"
            FE.f1IndiceItem = 1
            FE.F1DetalleOpcionalId = 27
            FE.F1DetalleOpcionalValor = rsEncabFact!Agente
            FE.F1DetalleCbtesAsocItemCantidad = 0
        ElseIf VTipoSistema = 18 Or VTipoSistema = 203 Or VTipoSistema = 17 Then
            FE.F1DetalleCbtesAsocItemCantidad = 1
            FE.f1IndiceItem = 0
            FE.F1DetalleCbtesAsocTipo = Lista.SubItems(8)
            FE.F1DetalleCbtesAsocPtoVta = Lista.SubItems(9)
            FE.F1DetalleCbtesAsocNroS = Lista.SubItems(10)
            FE.F1DetalleCbtesAsocCUIT = "30709381683"
            FCte = Mid(Lista.SubItems(11), 7, 4) & Mid(Lista.SubItems(11), 4, 2) & Mid(Lista.SubItems(11), 1, 2)
            FE.F1DetalleCbtesAsocFecha = FCte
            If VTipoSistema = 203 Then
                FE.F1DetalleOpcionalItemCantidad = 1
                FE.f1IndiceItem = 0
                FE.F1DetalleOpcionalId = 22
                FE.F1DetalleOpcionalValor = Lista.SubItems(12)
            End If
    
        End If
        
        lResultado = FE.F1CAESolicitar()
        If lResultado Then
            'MsgBox ("Factura Generada")
            'actualiza estado de CAE
            ErrorCAE = FE.F1RespuestaDetalleResultado
            If Not ErrorCAE = "A" Then
                'MsgBox ("error local: " + FE.UltimoMensajeError)
                'MsgBox ("ERROR:")
                'Ult = FE.F1CompUltimoAutorizadoS(4, 1)
                'Fecha = FE.F1CompUltimoAutorizadoST
                'MsgBox ("resultado global AFIP: " + FE.F1RespuestaResultado)
                'MsgBox ("es reproceso? " + FE.F1RespuestaReProceso)
                'MsgBox ("registros procesados por AFIP: " + Str(FE.F1RespuestaCantidadReg))
                'MsgBox ("error genérico global:" + FE.f1ErrorMsg1)
                ErrorCAE = Mid(FE.UltimoMensajeError, 1, 250)
                MsgBox "Factura Rechazada:" & FE.f1ErrorMsg
                Exit Sub
            End If
            With rsEncabFact
            .Edit
            .Fields("CAE") = FE.F1RespuestaDetalleCae
            .Fields("VtoCAE") = FE.F1RespuestaDetalleCAEFchVto
            .Fields("ObsCAE") = FE.F1RespuestaDetalleResultado
            .Fields("MotivoCAE") = FE.F1RespuestaDetalleObservacionMsg
            VRuta = App.Path + "\QR\qr" & VtipoComp & "_4_" & NroQR & ".jpg"
            .Fields("QR") = VRuta
            .Update
            End With
            Lista.SubItems(7) = FE.F1RespuestaDetalleCae
        Else
            MsgBox ("Error de Solicitud de CAE")
            Exit Sub
        End If
        
        If FE.F1RespuestaCantidadReg > 0 Then
            'FE.f1Indice = 0
            'MsgBox ("resultado detallado comprobante: " + FE.F1RespuestaDetalleResultado)
            'MsgBox ("cae comprobante: " + FE.F1RespuestaDetalleCae)
            'MsgBox ("número comprobante:" + FE.F1RespuestaDetalleCbteDesdeS)
            'MsgBox ("error detallado comprobante: " + FE.F1RespuestaDetalleObservacionMsg1)
            Exit Sub
        End If

        'GENERA QR
        FE.F1CabeceraCantReg = 1
        FE.F1CabeceraPtoVta = Lista.SubItems(1)
        FE.F1CabeceraCbteTipo = VtipoComp
        FE.f1Indice = 0
        FE.qrVersion = 1
        FE.F1DetalleConcepto = 1
        FE.F1DetalleDocTipo = 80
        FE.F1DetalleDocNro = VCUIT
        FE.F1DetalleCbteDesdeS = VNro
        FE.F1DetalleCbteFch = FCte
        i = Len((TFact))
        DIGITO = ""
        VTOTAL = ""
        For A = i To 1 Step -1
            DIGITO = Mid(TFact, A, 1)
            If Not DIGITO = "." Then
                VTOTAL = DIGITO & VTOTAL
            End If
        Next
        FE.F1DetalleImpTotal = VTOTAL
        FE.F1DetalleMonId = "PES"
        FE.F1DetalleMonCotiz = 1
        FE.F1Detalleqrtipocodigo = "E"
        Rem  fe.F1Detalleqrtipocodigo = "A" si es un CAE anticipado
        FE.F1DetalleCAEA = 1
        FE.F1DetalleQRArchivo = App.Path + "\QR\qr" & VtipoComp & "_4_" & NroQR & ".jpg"
        FE.f1detalleqrtolerancia = 1
        FE.f1detalleqrresolucion = 4
        FE.f1detalleqrformato = 6
        If FE.f1qrGenerar(99) Then
            'MsgBox ("gráfico generado con los datos. " + FE.f1qrmanualTexto)
        Else
            MsgBox ("error al generar imagen " + FE.ArchivoQRError + " " + FE.UltimoMensajeError)
        End If
        End Sub
Private Sub Command2_Click()
On Error Resume Next
II = 0
Select Case Comp.ListIndex
    Case 0:
        Registros = Comprobantes.ListItems.Count
        
        For II = 1 To Registros
                Set Lista = Comprobantes.ListItems.Item(II)
                If Lista.Checked = True Then
                    Call GeneraComprobante
                    Set crReporte = crapp.OpenReport(App.Path & "\factura.rpt")
                    Set DBTabl = crReporte.Database.Tables(1)
                    DBTabl.Location = App.Path & "\BaseDatos\BASEDATOS_TEMP.mdb"
                    'crReporte.ReportSource = crReporte
                    crReporte.PrintOut False '<== de esta forma se imprime en la impresora predeterminada
                End If
        Next
    Case 1:
        Registros = Comprobantes.ListItems.Count
        
        For II = 1 To Registros
                Set Lista = Comprobantes.ListItems.Item(II)
                If Lista.Checked = True Then
                    Call GeneraComprobante
                    Set crReporte = crapp.OpenReport(App.Path & "\NCFE.rpt")
                    Set DBTabl = crReporte.Database.Tables(1)
                    DBTabl.Location = App.Path & "\BaseDatos\BASEDATOS_TEMP.mdb"
                    'crReporte.ReportSource = crReporte
                    crReporte.PrintOut False '<== de esta forma se imprime en la impresora predeterminada
                End If
        Next
    Case 2:
        Registros = Comprobantes.ListItems.Count
        
        For II = 1 To Registros
                Set Lista = Comprobantes.ListItems.Item(II)
                If Lista.Checked = True Then
                    Call GeneraComprobante
                    Set crReporte = crapp.OpenReport(App.Path & "\ND_E.rpt")
                    Set DBTabl = crReporte.Database.Tables(1)
                    DBTabl.Location = App.Path & "\BaseDatos\BASEDATOS_TEMP.mdb"
                    'crReporte.ReportSource = crReporte
                    crReporte.PrintOut False '<== de esta forma se imprime en la impresora predeterminada
                End If
        Next
    Case 3:
        Registros = Comprobantes.ListItems.Count
        
        For II = 1 To Registros
                Set Lista = Comprobantes.ListItems.Item(II)
                If Lista.Checked = True Then
                    Call GeneraComprobante
                    Set crReporte = crapp.OpenReport(App.Path & "\FactMiPyme.rpt")
                    Set DBTabl = crReporte.Database.Tables(1)
                    DBTabl.Location = App.Path & "\BaseDatos\BASEDATOS_TEMP.mdb"
                    'crReporte.ReportSource = crReporte
                    crReporte.PrintOut False '<== de esta forma se imprime en la impresora predeterminada
                End If
        Next
    Case 4:
        Registros = Comprobantes.ListItems.Count
        For II = 1 To Registros
                Set Lista = Comprobantes.ListItems.Item(II)
                If Lista.Checked = True Then
                    Call GeneraComprobante
                    Set crReporte = crapp.OpenReport(App.Path & "\NCMiPyme.rpt")
                    Set DBTabl = crReporte.Database.Tables(1)
                    DBTabl.Location = App.Path & "\BaseDatos\BASEDATOS_TEMP.mdb"
                    'crReporte.ReportSource = crReporte
                    crReporte.PrintOut False '<== de esta forma se imprime en la impresora predeterminada
                End If
        Next
    Case 5:
        MsgBox "Sin Desarrollar"
    Case 6:
        Registros = Comprobantes.ListItems.Count
        For II = 1 To Registros
                Set Lista = Comprobantes.ListItems.Item(II)
                If Lista.Checked = True Then
                    Call GeneraComprobante
                    Set crReporte = crapp.OpenReport(App.Path & "\LiquidoP.rpt")
                    Set DBTabl = crReporte.Database.Tables(1)
                    DBTabl.Location = App.Path & "\BaseDatos\BASEDATOS_TEMP.mdb"
                    'crReporte.ReportSource = crReporte
                    crReporte.PrintOut False '<== de esta forma se imprime en la impresora predeterminada
                End If
        Next
    Case 7:
    Registros = Comprobantes.ListItems.Count
        
        For II = 1 To Registros
                Set Lista = Comprobantes.ListItems.Item(II)
                If Lista.Checked = True Then
                    Call GeneraComprobante
                    Set crReporte = crapp.OpenReport(App.Path & "\facturab.rpt")
                    Set DBTabl = crReporte.Database.Tables(1)
                    DBTabl.Location = App.Path & "\BaseDatos\BASEDATOS_TEMP.mdb"
                    'crReporte.ReportSource = crReporte
                    crReporte.PrintOut False '<== de esta forma se imprime en la impresora predeterminada
                End If
        Next
End Select

End Sub
Private Sub Consulta_ND()
Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where NroFE = " & Lista.SubItems(2) & " and PtoVtaFE = " & Lista.SubItems(1) & " and TipoSistema = 18")
Set rsDetFact = db.OpenRecordset("Select * From DetFE Where NroFact = " & Lista.SubItems(2) & " and PtoVta = " & Lista.SubItems(1) & " and TipoComp = 2")
With TrsEncabFact
        .AddNew
        .Fields("NroFact") = rsEncabFact!NroFE
        .Fields("Fecha") = rsEncabFact!FechaFE
        .Fields("Codigo") = rsEncabFact!CodClie
        If rsEncabFact!Emp_Flet = 0 Then
            Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
            .Fields("DescClie") = rsEmpresas!DescEmpresas
            .Fields("DirClie") = rsEmpresas!Direccion
            .Fields("LocCLie") = rsEmpresas!Localidad
            .Fields("CuitClie") = rsEmpresas!cuit
            
        Else
            Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!CodClie & "")
            .Fields("DescClie") = rsFleteros!DescFlet
            .Fields("DirClie") = rsFleteros!Direccion
            .Fields("LocCLie") = rsFleteros!Localidad
            .Fields("CuitClie") = rsFleteros!cuit
            
        End If
        
        .Fields("TNeto") = rsEncabFact!TotalNetofe
        .Fields("TIVa") = rsEncabFact!TotalIVAFE
        .Fields("TGRAL") = rsEncabFact!totalgralfe
        .Fields("CAE") = rsEncabFact!CAE
         DIA = Mid(rsEncabFact!VtoCAE, 7, 2)
        MES = Mid(rsEncabFact!VtoCAE, 5, 2)
        AÑO = Mid(rsEncabFact!VtoCAE, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
        .Fields("MotivoCAE") = rsEncabFact!obscae
        .Fields("ObsCAE") = rsEncabFact!obscae
        largo = Len(rsEncabFact!NroFE)
        Select Case largo
        Case 1: NRO = "0000000" & rsEncabFact!NroFE
        Case 2: NRO = "000000" & rsEncabFact!NroFE
        Case 3: NRO = "00000" & rsEncabFact!NroFE
        Case 4: NRO = "0000" & rsEncabFact!NroFE
        Case 5: NRO = "000" & rsEncabFact!NroFE
        Case 6: NRO = "00" & rsEncabFact!NroFE
        Case 7: NRO = "0" & rsEncabFact!NroFE
        Case 8: NRO = rsEncabFact!NroFE
        End Select
        .Fields("NroFE") = NRO
         largo = Len(rsEncabFact!PtoVtaFE)
        Select Case largo
            Case 1: NRO = "000" & rsEncabFact!PtoVtaFE
            Case 2: NRO = "00" & rsEncabFact!PtoVtaFE
            Case 3: NRO = "0" & rsEncabFact!PtoVtaFE
            Case 4: NRO = rsEncabFact!PtoVtaFE
        End Select
        .Fields("PtovtaFE") = NRO
        .Fields("QR") = rsEncabFact!QR
        .Update
    End With
    Do While Not rsDetFact.EOF
        TrsDetFact.AddNew
        TrsDetFact.Fields("NroFact") = rsDetFact!NroFact
        TrsDetFact.Fields("ConceptoNC") = rsDetFact!ConceptoNC
        TrsDetFact.Fields("Stotal") = rsDetFact!STotal
        TrsDetFact.Update
        rsDetFact.MoveNext
    Loop
End Sub
Private Sub Consulta_NC()
Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where NroFE = " & Lista.SubItems(2) & " and PtoVtaFE = " & Lista.SubItems(1) & " and TipoSistema = 17")
Set rsDetFact = db.OpenRecordset("Select * From DetFE Where NroFact = " & Lista.SubItems(2) & " and PtoVta = " & Lista.SubItems(1) & " and TipoComp = 3")

 With TrsEncabFact
        .AddNew
        .Fields("NroFact") = rsEncabFact!NroFE
        .Fields("Fecha") = rsEncabFact!FechaFE
        .Fields("Codigo") = rsEncabFact!CodClie
        If rsEncabFact!Emp_Flet = 0 Then
            Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!CodClie & "")
            .Fields("DescClie") = rsFleteros!DescFlet
            .Fields("DirClie") = rsFleteros!Direccion
            .Fields("LocCLie") = rsFleteros!Localidad
            .Fields("CuitClie") = rsFleteros!cuit
        Else
            Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
            .Fields("DescClie") = rsEmpresas!DescEmpresas
            .Fields("DirClie") = rsEmpresas!Direccion
            .Fields("LocCLie") = rsEmpresas!Localidad
            .Fields("CuitClie") = rsEmpresas!cuit
        End If
        .Fields("TNeto") = rsEncabFact!TotalNetofe
        .Fields("TIVa") = rsEncabFact!TotalIVAFE
        .Fields("TGRAL") = rsEncabFact!totalgralfe
        .Fields("CAE") = rsEncabFact!CAE
         DIA = Mid(rsEncabFact!VtoCAE, 7, 2)
        MES = Mid(rsEncabFact!VtoCAE, 5, 2)
        AÑO = Mid(rsEncabFact!VtoCAE, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
        .Fields("MotivoCAE") = rsEncabFact!obscae
        .Fields("ObsCAE") = rsEncabFact!obscae
        largo = Len(rsEncabFact!NroFE)
        Select Case largo
        Case 1: NRO = "0000000" & rsEncabFact!NroFE
        Case 2: NRO = "000000" & rsEncabFact!NroFE
        Case 3: NRO = "00000" & rsEncabFact!NroFE
        Case 4: NRO = "0000" & rsEncabFact!NroFE
        Case 5: NRO = "000" & rsEncabFact!NroFE
        Case 6: NRO = "00" & rsEncabFact!NroFE
        Case 7: NRO = "0" & rsEncabFact!NroFE
        Case 8: NRO = rsEncabFact!NroFE
        End Select
        .Fields("NroFE") = NRO
        
         largo = Len(rsEncabFact!PtoVtaFE)
        Select Case largo
            Case 1: NRO = "000" & rsEncabFact!PtoVtaFE
            Case 2: NRO = "00" & rsEncabFact!PtoVtaFE
            Case 3: NRO = "0" & rsEncabFact!PtoVtaFE
            Case 4: NRO = rsEncabFact!PtoVtaFE
        End Select
        .Fields("PtovtaFE") = NRO
        .Fields("QR") = rsEncabFact!QR
        .Update
    End With
    Do While Not rsDetFact.EOF
        TrsDetFact.AddNew
        TrsDetFact.Fields("NroFact") = rsDetFact!NroFact
        TrsDetFact.Fields("ConceptoNC") = rsDetFact!ConceptoNC
        TrsDetFact.Fields("Stotal") = rsDetFact!STotal
        TrsDetFact.Update
        rsDetFact.MoveNext
    Loop
    
End Sub

Private Sub GeneraComprobante()
Set TrsEncabFact = dbTemp.OpenRecordset("EncabFact")
Set TrsDetFact = dbTemp.OpenRecordset("DetFact")
Do While Not TrsEncabFact.EOF
    TrsEncabFact.Delete
    TrsEncabFact.MoveNext
Loop
Do While Not TrsDetFact.EOF
    TrsDetFact.Delete
    TrsDetFact.MoveNext
Loop
If Comp.ListIndex = 0 Then
    Call Consulta_FA
ElseIf Comp.ListIndex = 2 Then
    Call Consulta_ND
ElseIf Comp.ListIndex = 1 Then
    Call Consulta_NC
ElseIf Comp.ListIndex = 3 Then
    Call Consulta_MiPyme
ElseIf Comp.ListIndex = 4 Then
    Call Consulta_NCPyme
ElseIf Comp.ListIndex = 6 Then
    Call Consulta_LP
ElseIf Comp.ListIndex = 7 Then
    Call Consulta_FB
    
End If

End Sub
Private Sub Consulta_LP()
Set rsEncab_LP = db.OpenRecordset("Select * From EncabLProd Where NroComp = " & Lista.SubItems(2) & "")
    Set rsDet_LP = db.OpenRecordset("Select * from DetViajesLP Where NroComp = " & Lista.SubItems(2) & "")
    Set TrsEncabFact = dbTemp.OpenRecordset("EncabFact")
    Set TrsDetFact = dbTemp.OpenRecordset("DetFact")
    Set rsFleteros = db.OpenRecordset("SELECT * FROM Fleteros WHERE Codflet = " & rsEncab_LP!codflet & "")
        
        With TrsEncabFact
        .AddNew
        VNro = rsEncab_LP!NroComp
        largo = Len(VNro)
        Select Case largo
            Case 1: NRO = "0000000" & VNro
            Case 2: NRO = "000000" & VNro
            Case 3: NRO = "00000" & VNro
            Case 4: NRO = "0000" & VNro
            Case 5: NRO = "000" & VNro
            Case 6: NRO = "00" & VNro
            Case 7: NRO = "0" & VNro
            Case 8: NRO = VNro
        End Select
        .Fields("NroFact") = VNro
        .Fields("Fecha") = rsEncab_LP!Fecha
        .Fields("Codigo") = rsEncab_LP!codflet
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncab_LP!codflet & "")
        .Fields("DescClie") = rsFleteros!DescFlet
        .Fields("DirClie") = rsFleteros!Direccion
        .Fields("LocCLie") = rsFleteros!Localidad
        .Fields("CuitClie") = rsFleteros!cuit
        '.Fields("TipoFact") = 1 '1 - Factura Viajes, 2- Factura de Comisión
        .Fields("NetoViajes") = rsEncab_LP!TotalViajes
        .Fields("NetoComis") = rsEncab_LP!netocomis
        .Fields("TNeto") = rsEncab_LP!netoviajes
        .Fields("TIVA") = rsEncab_LP!ivaviaje
        .Fields("TGral") = rsEncab_LP!totalviajeS1
        .Fields("CAE") = rsEncab_LP!CAE
        .Fields("ObsCAE") = rsEncab_LP!obscae
        DIA = Mid(rsEncab_LP!FVto, 7, 2)
        MES = Mid(rsEncab_LP!FVto, 5, 2)
        AÑO = Mid(rsEncab_LP!FVto, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
        '.Fields("MotivoCAE") = rsEncab_LP!motivocae
        .Fields("NroFE") = NRO
        .Fields("PtoVtaFE") = "0004"
        .Fields("QR") = rsEncab_LP!QR
        .Update
        End With

        ''' GRABA DETALLE '''
        Do While Not rsDet_LP.EOF
                       
            With TrsDetFact
            .AddNew
            .Fields("NroFact") = VNro
            .Fields("FechaViaje") = rsDet_LP!FechaViaje
            .Fields("NroRem") = rsDet_LP!rEMITO
            .Fields("Mercaderia") = rsDet_LP!mERCADERIA
            .Fields("Procedencia") = rsDet_LP!pROCEDENCIA
            .Fields("Destino") = rsDet_LP!dESTINO
            .Fields("Kilos") = rsDet_LP!kilos
            .Fields("Tarifa") = rsDet_LP!tarifa
            .Fields("STotal") = rsDet_LP!sUBTOTAL
            .Update

            
            End With
            rsDet_LP.MoveNext
        Loop

End Sub

Private Sub Consulta_NCPyme()
On Error Resume Next
Dim cALetra As New clsNum2Let

Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where NroFE = " & Lista.SubItems(2) & " and PtoVtaFE = " & Lista.SubItems(1) & " and TipoSistema = 203")
Set rsDetFact = db.OpenRecordset("Select * From DetFE Where NroFact = " & Lista.SubItems(2) & " and PtoVta = " & Lista.SubItems(1) & " and TipoComp = 203")
If rsEncabFact!ClaseFact = 2 Then
    With TrsEncabFact
        .AddNew
        .Fields("NroFact") = rsEncabFact!NroFE
        .Fields("Fecha") = rsEncabFact!FechaFE
        .Fields("Codigo") = rsEncabFact!CodClie
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!CodClie & "")
        .Fields("DescClie") = rsFleteros!DescFlet
        .Fields("DirClie") = rsFleteros!Direccion
        .Fields("LocCLie") = rsFleteros!Localidad
        .Fields("CuitClie") = rsFleteros!cuit
        .Fields("TNeto") = rsEncabFact!TotalNetofe
        .Fields("TIVa") = rsEncabFact!TotalIVAFE
        .Fields("TGRAL") = rsEncabFact!totalgralfe
        .Fields("CAE") = rsEncabFact!CAE
         DIA = Mid(rsEncabFact!VtoCAE, 7, 2)
        MES = Mid(rsEncabFact!VtoCAE, 5, 2)
        AÑO = Mid(rsEncabFact!VtoCAE, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
        DIA = Mid(rsEncabFact!FPago, 7, 2)
        MES = Mid(rsEncabFact!FPago, 5, 2)
        AÑO = Mid(rsEncabFact!FPago, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("FPago") = FVTOCAE
        .Fields("MotivoCAE") = rsEncabFact!obscae
        .Fields("ObsCAE") = rsEncabFact!obscae
        largo = Len(rsEncabFact!NroFE)
        Select Case largo
        Case 1: NRO = "0000000" & rsEncabFact!NroFE
        Case 2: NRO = "000000" & rsEncabFact!NroFE
        Case 3: NRO = "00000" & rsEncabFact!NroFE
        Case 4: NRO = "0000" & rsEncabFact!NroFE
        Case 5: NRO = "000" & rsEncabFact!NroFE
        Case 6: NRO = "00" & rsEncabFact!NroFE
        Case 7: NRO = "0" & rsEncabFact!NroFE
        Case 8: NRO = rsEncabFact!NroFE
        End Select
        .Fields("NroFE") = NRO
         largo = Len(rsEncabFact!PtoVtaFE)
        Select Case largo
            Case 1: NRO = "000" & rsEncabFact!PtoVtaFE
            Case 2: NRO = "00" & rsEncabFact!PtoVtaFE
            Case 3: NRO = "0" & rsEncabFact!PtoVtaFE
            Case 4: NRO = rsEncabFact!PtoVtaFE
        End Select
        .Fields("PtovtaFE") = NRO
        If rsEncabFact!ImpLetras = "" Or IsNull(rsEncabFact!ImpLetras) Then
            cALetra.Numero = Val(rsEncabFact!totalgralfe)
            Impletra = justificarTextoFMiPyme(cALetra.ALetra, 250, 0)
            .Fields("ImpLetras") = Impletra & ".--"
        Else
            .Fields("ImpLetras") = rsEncabFact!ImpLetras
        End If
        .Fields("QR") = rsEncabFact!QR
        .Update
    End With
    Do While Not rsDetFact.EOF
        TrsDetFact.AddNew
        TrsDetFact.Fields("NroFact") = rsDetFact!NroFact
        TrsDetFact.Fields("Mercaderia") = rsDetFact!mERCADERIA
        TrsDetFact.Fields("Stotal") = rsDetFact!STotal
        TrsDetFact.Fields("Cupo") = rsDetFact!Cupo
        TrsDetFact.Update
        rsDetFact.MoveNext
    Loop
    Dim frmRep1 As New InfFMiPyme
    frmRep1.Show vbModal
Else
'factua de viajes
    With TrsEncabFact
        .AddNew
        .Fields("NroFact") = rsEncabFact!NroFE
        .Fields("Fecha") = rsEncabFact!FechaFE
        .Fields("Codigo") = rsEncabFact!CodClie
        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
        .Fields("DescClie") = rsEmpresas!DescEmpresas
        .Fields("DirClie") = rsEmpresas!Direccion
        .Fields("LocCLie") = rsEmpresas!Localidad
        .Fields("CuitClie") = rsEmpresas!cuit
        .Fields("TNeto") = rsEncabFact!TotalNetofe
        .Fields("TIVa") = rsEncabFact!TotalIVAFE
        .Fields("TGRAL") = rsEncabFact!totalgralfe
        .Fields("CAE") = rsEncabFact!CAE
         DIA = Mid(rsEncabFact!VtoCAE, 7, 2)
        MES = Mid(rsEncabFact!VtoCAE, 5, 2)
        AÑO = Mid(rsEncabFact!VtoCAE, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
         DIA = Mid(rsEncabFact!FPago, 7, 2)
        MES = Mid(rsEncabFact!FPago, 5, 2)
        AÑO = Mid(rsEncabFact!FPago, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("FPago") = FVTOCAE
        .Fields("MotivoCAE") = rsEncabFact!obscae
        .Fields("ObsCAE") = rsEncabFact!obscae
        largo = Len(rsEncabFact!NroFE)
        Select Case largo
        Case 1: NRO = "0000000" & rsEncabFact!NroFE
        Case 2: NRO = "000000" & rsEncabFact!NroFE
        Case 3: NRO = "00000" & rsEncabFact!NroFE
        Case 4: NRO = "0000" & rsEncabFact!NroFE
        Case 5: NRO = "000" & rsEncabFact!NroFE
        Case 6: NRO = "00" & rsEncabFact!NroFE
        Case 7: NRO = "0" & rsEncabFact!NroFE
        Case 8: NRO = rsEncabFact!NroFE
        End Select
        .Fields("NroFE") = NRO
        .Fields("PtovtaFE") = "0004"
        If rsEncabFact!ImpLetras = "" Or IsNull(rsEncabFact!ImpLetras) Then
            cALetra.Numero = Val(rsEncabFact!totalgralfe)
            Impletra = justificarTextoFMiPyme(cALetra.ALetra, 250, 0)
            .Fields("ImpLetras") = Impletra & ".--"
        Else
            .Fields("ImpLetras") = rsEncabFact!ImpLetras
        End If
        .Fields("QR") = rsEncabFact!QR
        .Update
    End With
    Do While Not rsDetFact.EOF
        TrsDetFact.AddNew
        TrsDetFact.Fields("NroFact") = rsDetFact!NroFact
        TrsDetFact.Fields("FechaViaje") = rsDetFact!FechaViaje
        TrsDetFact.Fields("NroRem") = rsDetFact!NroRem
        TrsDetFact.Fields("Chofer") = rsDetFact!Chofer
        TrsDetFact.Fields("Mercaderia") = rsDetFact!mERCADERIA
        TrsDetFact.Fields("Procedencia") = rsDetFact!pROCEDENCIA
        TrsDetFact.Fields("Destino") = rsDetFact!dESTINO
        TrsDetFact.Fields("Kilos") = rsDetFact!kilos
        TrsDetFact.Fields("Tarifa") = rsDetFact!tarifa
        TrsDetFact.Fields("Stotal") = rsDetFact!STotal
        TrsDetFact.Fields("Cupo") = rsDetFact!Cupo
        TrsDetFact.Fields("ConceptoNC") = rsDetFact!ConceptoNC
        TrsDetFact.Update
        rsDetFact.MoveNext
    Loop
End If
End Sub

Private Sub Consulta_MiPyme()
Dim cALetra As New clsNum2Let, Impletra As String
Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where NroFE = " & Lista.SubItems(2) & " and PtoVtaFE = " & Lista.SubItems(1) & " and TipoSistema = 201")
Set rsDetFact = db.OpenRecordset("Select * From DetFE Where NroFact = " & Lista.SubItems(2) & " and PtoVta = " & Lista.SubItems(1) & " and TipoComp = 201")

If rsEncabFact!ClaseFact = 2 Then
    With TrsEncabFact
        .AddNew
        .Fields("NroFact") = rsEncabFact!NroFE
        .Fields("Fecha") = rsEncabFact!FechaFE
        .Fields("Codigo") = rsEncabFact!CodClie
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!CodClie & "")
        .Fields("DescClie") = rsFleteros!DescFlet
        .Fields("DirClie") = rsFleteros!Direccion
        .Fields("LocCLie") = rsFleteros!Localidad
        .Fields("CuitClie") = rsFleteros!cuit
        .Fields("Obs") = rsEncabFact!ObsFE
        .Fields("TNeto") = rsEncabFact!TotalNetofe
        .Fields("TIVa") = rsEncabFact!TotalIVAFE
        .Fields("TGRAL") = rsEncabFact!totalgralfe
        .Fields("CAE") = rsEncabFact!CAE
         DIA = Mid(rsEncabFact!VtoCAE, 7, 2)
        MES = Mid(rsEncabFact!VtoCAE, 5, 2)
        AÑO = Mid(rsEncabFact!VtoCAE, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
        DIA = Mid(rsEncabFact!FPago, 7, 2)
        MES = Mid(rsEncabFact!FPago, 5, 2)
        AÑO = Mid(rsEncabFact!FPago, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("FPago") = FVTOCAE
        .Fields("MotivoCAE") = rsEncabFact!obscae
        .Fields("ObsCAE") = rsEncabFact!obscae
        largo = Len(rsEncabFact!NroFE)
        Select Case largo
        Case 1: NRO = "0000000" & rsEncabFact!NroFE
        Case 2: NRO = "000000" & rsEncabFact!NroFE
        Case 3: NRO = "00000" & rsEncabFact!NroFE
        Case 4: NRO = "0000" & rsEncabFact!NroFE
        Case 5: NRO = "000" & rsEncabFact!NroFE
        Case 6: NRO = "00" & rsEncabFact!NroFE
        Case 7: NRO = "0" & rsEncabFact!NroFE
        Case 8: NRO = rsEncabFact!NroFE
        End Select
        .Fields("NroFE") = NRO
        largo = Len(rsEncabFact!PtoVtaFE)
        Select Case largo
            Case 1: NRO = "000" & rsEncabFact!PtoVtaFE
            Case 2: NRO = "00" & rsEncabFact!PtoVtaFE
            Case 3: NRO = "0" & rsEncabFact!PtoVtaFE
            Case 4: NRO = rsEncabFact!PtoVtaFE
        End Select
        .Fields("PtovtaFE") = NRO
        If rsEncabFact!ImpLetras = "" Or IsNull(rsEncabFact!ImpLetras) Then
            cALetra.Numero = Val(rsEncabFact!totalgralfe)
            Impletra = justificarTextoFMiPyme(cALetra.ALetra, 250, 0)
            .Fields("ImpLetras") = Impletra & ".--"
        Else
            .Fields("ImpLetras") = rsEncabFact!ImpLetras
        End If
        .Fields("QR") = rsEncabFact!QR
        .Update
    End With
    Do While Not rsDetFact.EOF
        TrsDetFact.AddNew
        TrsDetFact.Fields("NroFact") = rsDetFact!NroFact
        TrsDetFact.Fields("Mercaderia") = rsDetFact!mERCADERIA
        TrsDetFact.Fields("Stotal") = rsDetFact!STotal
        TrsDetFact.Fields("Cupo") = rsDetFact!Cupo
        TrsDetFact.Fields("ConceptoNC") = rsDetFact!ComceptoNC
        TrsDetFact.Update
        rsDetFact.MoveNext
    Loop
    'Dim frmRep1 As New InfFMiPyme
    'frmRep1.Show vbModal
Else
'factua de viajes
    With TrsEncabFact
        .AddNew
        .Fields("NroFact") = rsEncabFact!NroFE
        .Fields("Fecha") = rsEncabFact!FechaFE
        .Fields("Codigo") = rsEncabFact!CodClie
        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
        .Fields("DescClie") = rsEmpresas!DescEmpresas
        .Fields("DirClie") = rsEmpresas!Direccion
        .Fields("LocCLie") = rsEmpresas!Localidad
        .Fields("CuitClie") = rsEmpresas!cuit
        .Fields("TNeto") = rsEncabFact!TotalNetofe
        .Fields("TIVa") = rsEncabFact!TotalIVAFE
        .Fields("TGRAL") = rsEncabFact!totalgralfe
        .Fields("Obs") = rsEncabFact!ObsFE
        .Fields("CAE") = rsEncabFact!CAE
         DIA = Mid(rsEncabFact!VtoCAE, 7, 2)
        MES = Mid(rsEncabFact!VtoCAE, 5, 2)
        AÑO = Mid(rsEncabFact!VtoCAE, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
         DIA = Mid(rsEncabFact!FPago, 7, 2)
        MES = Mid(rsEncabFact!FPago, 5, 2)
        AÑO = Mid(rsEncabFact!FPago, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("FPago") = FVTOCAE
        .Fields("MotivoCAE") = rsEncabFact!obscae
        .Fields("ObsCAE") = rsEncabFact!obscae
        largo = Len(rsEncabFact!NroFE)
        Select Case largo
        Case 1: NRO = "0000000" & rsEncabFact!NroFE
        Case 2: NRO = "000000" & rsEncabFact!NroFE
        Case 3: NRO = "00000" & rsEncabFact!NroFE
        Case 4: NRO = "0000" & rsEncabFact!NroFE
        Case 5: NRO = "000" & rsEncabFact!NroFE
        Case 6: NRO = "00" & rsEncabFact!NroFE
        Case 7: NRO = "0" & rsEncabFact!NroFE
        Case 8: NRO = rsEncabFact!NroFE
        End Select
        .Fields("NroFE") = NRO
         largo = Len(rsEncabFact!PtoVtaFE)
        Select Case largo
            Case 1: NRO = "000" & rsEncabFact!PtoVtaFE
            Case 2: NRO = "00" & rsEncabFact!PtoVtaFE
            Case 3: NRO = "0" & rsEncabFact!PtoVtaFE
            Case 4: NRO = rsEncabFact!PtoVtaFE
        End Select
        .Fields("PtovtaFE") = NRO
        If rsEncabFact!ImpLetras = "" Or IsNull(rsEncabFact!ImpLetras) Then
            cALetra.Numero = Val(rsEncabFact!totalgralfe)
            Impletra = justificarTextoFMiPyme(cALetra.ALetra, 250, 0)
            .Fields("ImpLetras") = Impletra & ".--"
        Else
            .Fields("ImpLetras") = rsEncabFact!ImpLetras
        End If
        .Fields("QR") = rsEncabFact!QR
        .Update
    End With
    Do While Not rsDetFact.EOF
        TrsDetFact.AddNew
        TrsDetFact.Fields("NroFact") = rsDetFact!NroFact
        TrsDetFact.Fields("FechaViaje") = rsDetFact!FechaViaje
        TrsDetFact.Fields("NroRem") = rsDetFact!NroRem
        TrsDetFact.Fields("Chofer") = rsDetFact!Chofer
        TrsDetFact.Fields("Mercaderia") = rsDetFact!mERCADERIA
        TrsDetFact.Fields("Procedencia") = rsDetFact!pROCEDENCIA
        TrsDetFact.Fields("Destino") = rsDetFact!dESTINO
        TrsDetFact.Fields("Kilos") = rsDetFact!kilos
        TrsDetFact.Fields("Tarifa") = rsDetFact!tarifa
        TrsDetFact.Fields("Stotal") = rsDetFact!STotal
        TrsDetFact.Fields("Cupo") = rsDetFact!Cupo
        TrsDetFact.Fields("ConceptoNC") = rsDetFact!ConceptoNC
        TrsDetFact.Update
        rsDetFact.MoveNext
    Loop
    
End If

End Sub
Private Sub Consulta_FB()
Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where NroFE = " & Lista.SubItems(2) & " and PtoVtaFE = " & Lista.SubItems(1) & " and TipoSistema = 19")
Set rsDetFact = db.OpenRecordset("Select * From DetFE Where NroFact = " & Lista.SubItems(2) & " and PtoVta = " & Lista.SubItems(1) & " and TipoComp = 6")

If rsEncabFact!ClaseFact = 2 Then
    With TrsEncabFact
        .AddNew
        .Fields("NroFact") = rsEncabFact!NroFE
        .Fields("Fecha") = rsEncabFact!FechaFE
        .Fields("Codigo") = rsEncabFact!CodClie
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!CodClie & "")
        .Fields("DescClie") = rsFleteros!DescFlet
        .Fields("DirClie") = rsFleteros!Direccion
        .Fields("LocCLie") = rsFleteros!Localidad
        .Fields("CuitClie") = rsFleteros!cuit
        .Fields("TNeto") = rsEncabFact!TotalNetofe
        .Fields("TIVa") = rsEncabFact!TotalIVAFE
        .Fields("TGRAL") = rsEncabFact!totalgralfe
        .Fields("CAE") = rsEncabFact!CAE
        DIA = Mid(rsEncabFact!VtoCAE, 7, 2)
        MES = Mid(rsEncabFact!VtoCAE, 5, 2)
        AÑO = Mid(rsEncabFact!VtoCAE, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
        .Fields("MotivoCAE") = rsEncabFact!obscae
        .Fields("ObsCAE") = rsEncabFact!obscae
        largo = Len(rsEncabFact!NroFE)
        Select Case largo
            Case 1: NRO = "0000000" & rsEncabFact!NroFE
            Case 2: NRO = "000000" & rsEncabFact!NroFE
            Case 3: NRO = "00000" & rsEncabFact!NroFE
            Case 4: NRO = "0000" & rsEncabFact!NroFE
            Case 5: NRO = "000" & rsEncabFact!NroFE
            Case 6: NRO = "00" & rsEncabFact!NroFE
            Case 7: NRO = "0" & rsEncabFact!NroFE
            Case 8: NRO = rsEncabFact!NroFE
        End Select
        .Fields("NroFE") = NRO
         largo = Len(rsEncabFact!PtoVtaFE)
        Select Case largo
            Case 1: NRO = "000" & rsEncabFact!PtoVtaFE
            Case 2: NRO = "00" & rsEncabFact!PtoVtaFE
            Case 3: NRO = "0" & rsEncabFact!PtoVtaFE
            Case 4: NRO = rsEncabFact!PtoVtaFE
        End Select
        .Fields("PtovtaFE") = NRO
        .Fields("QR") = rsEncabFact!QR
        .Update
    End With
    Do While Not rsDetFact.EOF
        TrsDetFact.AddNew
        TrsDetFact.Fields("NroFact") = rsDetFact!NroFact
        TrsDetFact.Fields("Mercaderia") = rsDetFact!mERCADERIA
        TrsDetFact.Fields("Stotal") = rsDetFact!STotal
        TrsDetFact.Fields("Cupo") = rsDetFact!Cupo
        TrsDetFact.Update
        rsDetFact.MoveNext
    Loop
    Dim frmRep1 As New InfFacturaComis
    frmRep1.Show vbModal
Else
'factua de viajes
    With TrsEncabFact
        .AddNew
        .Fields("NroFact") = rsEncabFact!NroFE
        .Fields("Fecha") = rsEncabFact!FechaFE
        .Fields("Codigo") = rsEncabFact!CodClie
        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
        .Fields("DescClie") = rsEmpresas!DescEmpresas
        .Fields("DirClie") = rsEmpresas!Direccion
        .Fields("LocCLie") = rsEmpresas!Localidad
        .Fields("CuitClie") = rsEmpresas!cuit
        .Fields("TNeto") = rsEncabFact!TotalNetofe
        .Fields("TIVa") = rsEncabFact!TotalIVAFE
        .Fields("TGRAL") = rsEncabFact!totalgralfe
        .Fields("CAE") = rsEncabFact!CAE
         DIA = Mid(rsEncabFact!VtoCAE, 7, 2)
        MES = Mid(rsEncabFact!VtoCAE, 5, 2)
        AÑO = Mid(rsEncabFact!VtoCAE, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
        .Fields("MotivoCAE") = rsEncabFact!obscae
        .Fields("ObsCAE") = rsEncabFact!obscae
        largo = Len(rsEncabFact!NroFE)
        Select Case largo
        Case 1: NRO = "0000000" & rsEncabFact!NroFE
        Case 2: NRO = "000000" & rsEncabFact!NroFE
        Case 3: NRO = "00000" & rsEncabFact!NroFE
        Case 4: NRO = "0000" & rsEncabFact!NroFE
        Case 5: NRO = "000" & rsEncabFact!NroFE
        Case 6: NRO = "00" & rsEncabFact!NroFE
        Case 7: NRO = "0" & rsEncabFact!NroFE
        Case 8: NRO = rsEncabFact!NroFE
        End Select
        .Fields("NroFE") = NRO
        largo = Len(rsEncabFact!PtoVtaFE)
        Select Case largo
        Case 1: NRO = "000" & rsEncabFact!PtoVtaFE
        Case 2: NRO = "00" & rsEncabFact!PtoVtaFE
        Case 3: NRO = "0" & rsEncabFact!PtoVtaFE
        Case 4: NRO = rsEncabFact!PtoVtaFE
        End Select
        .Fields("PtovtaFE") = NRO
        .Fields("QR") = rsEncabFact!QR
        .Update
    End With
    Do While Not rsDetFact.EOF
        TrsDetFact.AddNew
        TrsDetFact.Fields("NroFact") = rsDetFact!NroFact
        TrsDetFact.Fields("FechaViaje") = rsDetFact!FechaViaje
        TrsDetFact.Fields("NroRem") = rsDetFact!NroRem
        TrsDetFact.Fields("Chofer") = rsDetFact!Chofer
        TrsDetFact.Fields("Mercaderia") = rsDetFact!mERCADERIA
        TrsDetFact.Fields("Procedencia") = rsDetFact!pROCEDENCIA
        TrsDetFact.Fields("Destino") = rsDetFact!dESTINO
        TrsDetFact.Fields("Kilos") = rsDetFact!kilos
        TrsDetFact.Fields("Tarifa") = rsDetFact!tarifa * 1.21
        TrsDetFact.Fields("Stotal") = rsDetFact!STotal * 1.21
        TrsDetFact.Fields("Cupo") = rsDetFact!Cupo
        TrsDetFact.Fields("ConceptoNC") = rsDetFact!ConceptoNC
        TrsDetFact.Update
        rsDetFact.MoveNext
    Loop
      'Dim frmRep As New InfFactura
            
        'frmRep.Show vbModal
End If

End Sub
Private Sub Consulta_FA()

Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where NroFE = " & Lista.SubItems(2) & " and PtoVtaFE = " & Lista.SubItems(1) & " and TipoSistema = 16")
Set rsDetFact = db.OpenRecordset("Select * From DetFE Where NroFact = " & Lista.SubItems(2) & " and PtoVta = " & Lista.SubItems(1) & " and TipoComp = 1")

If rsEncabFact!ClaseFact = 2 Then
    With TrsEncabFact
        .AddNew
        .Fields("NroFact") = rsEncabFact!NroFE
        .Fields("Fecha") = rsEncabFact!FechaFE
        .Fields("Codigo") = rsEncabFact!CodClie
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!CodClie & "")
        .Fields("DescClie") = rsFleteros!DescFlet
        .Fields("DirClie") = rsFleteros!Direccion
        .Fields("LocCLie") = rsFleteros!Localidad
        .Fields("CuitClie") = rsFleteros!cuit
        .Fields("TNeto") = rsEncabFact!TotalNetofe
        .Fields("TIVa") = rsEncabFact!TotalIVAFE
        .Fields("TGRAL") = rsEncabFact!totalgralfe
        .Fields("CAE") = rsEncabFact!CAE
        DIA = Mid(rsEncabFact!VtoCAE, 7, 2)
        MES = Mid(rsEncabFact!VtoCAE, 5, 2)
        AÑO = Mid(rsEncabFact!VtoCAE, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
        .Fields("MotivoCAE") = rsEncabFact!obscae
        .Fields("ObsCAE") = rsEncabFact!obscae
        largo = Len(rsEncabFact!NroFE)
        Select Case largo
            Case 1: NRO = "0000000" & rsEncabFact!NroFE
            Case 2: NRO = "000000" & rsEncabFact!NroFE
            Case 3: NRO = "00000" & rsEncabFact!NroFE
            Case 4: NRO = "0000" & rsEncabFact!NroFE
            Case 5: NRO = "000" & rsEncabFact!NroFE
            Case 6: NRO = "00" & rsEncabFact!NroFE
            Case 7: NRO = "0" & rsEncabFact!NroFE
            Case 8: NRO = rsEncabFact!NroFE
        End Select
        .Fields("NroFE") = NRO
         largo = Len(rsEncabFact!PtoVtaFE)
        Select Case largo
            Case 1: NRO = "000" & rsEncabFact!PtoVtaFE
            Case 2: NRO = "00" & rsEncabFact!PtoVtaFE
            Case 3: NRO = "0" & rsEncabFact!PtoVtaFE
            Case 4: NRO = rsEncabFact!PtoVtaFE
        End Select
        .Fields("PtovtaFE") = NRO
        .Fields("QR") = rsEncabFact!QR
        .Update
    End With
    Do While Not rsDetFact.EOF
        TrsDetFact.AddNew
        TrsDetFact.Fields("NroFact") = rsDetFact!NroFact
        TrsDetFact.Fields("Mercaderia") = rsDetFact!mERCADERIA
        TrsDetFact.Fields("Stotal") = rsDetFact!STotal
        TrsDetFact.Fields("Cupo") = rsDetFact!Cupo
        TrsDetFact.Update
        rsDetFact.MoveNext
    Loop
    Dim frmRep1 As New InfFacturaComis
    frmRep1.Show vbModal
Else
'factua de viajes
    With TrsEncabFact
        .AddNew
        .Fields("NroFact") = rsEncabFact!NroFE
        .Fields("Fecha") = rsEncabFact!FechaFE
        .Fields("Codigo") = rsEncabFact!CodClie
        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
        .Fields("DescClie") = rsEmpresas!DescEmpresas
        .Fields("DirClie") = rsEmpresas!Direccion
        .Fields("LocCLie") = rsEmpresas!Localidad
        .Fields("CuitClie") = rsEmpresas!cuit
        .Fields("TNeto") = rsEncabFact!TotalNetofe
        .Fields("TIVa") = rsEncabFact!TotalIVAFE
        .Fields("TGRAL") = rsEncabFact!totalgralfe
        .Fields("CAE") = rsEncabFact!CAE
         DIA = Mid(rsEncabFact!VtoCAE, 7, 2)
        MES = Mid(rsEncabFact!VtoCAE, 5, 2)
        AÑO = Mid(rsEncabFact!VtoCAE, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
        .Fields("MotivoCAE") = rsEncabFact!obscae
        .Fields("ObsCAE") = rsEncabFact!obscae
        largo = Len(rsEncabFact!NroFE)
        Select Case largo
        Case 1: NRO = "0000000" & rsEncabFact!NroFE
        Case 2: NRO = "000000" & rsEncabFact!NroFE
        Case 3: NRO = "00000" & rsEncabFact!NroFE
        Case 4: NRO = "0000" & rsEncabFact!NroFE
        Case 5: NRO = "000" & rsEncabFact!NroFE
        Case 6: NRO = "00" & rsEncabFact!NroFE
        Case 7: NRO = "0" & rsEncabFact!NroFE
        Case 8: NRO = rsEncabFact!NroFE
        End Select
        .Fields("NroFE") = NRO
        largo = Len(rsEncabFact!PtoVtaFE)
        Select Case largo
        Case 1: NRO = "000" & rsEncabFact!PtoVtaFE
        Case 2: NRO = "00" & rsEncabFact!PtoVtaFE
        Case 3: NRO = "0" & rsEncabFact!PtoVtaFE
        Case 4: NRO = rsEncabFact!PtoVtaFE
        End Select
        .Fields("PtovtaFE") = NRO
        .Fields("QR") = rsEncabFact!QR
        .Update
    End With
    Do While Not rsDetFact.EOF
        TrsDetFact.AddNew
        TrsDetFact.Fields("NroFact") = rsDetFact!NroFact
        TrsDetFact.Fields("FechaViaje") = rsDetFact!FechaViaje
        TrsDetFact.Fields("NroRem") = rsDetFact!NroRem
        TrsDetFact.Fields("Chofer") = rsDetFact!Chofer
        TrsDetFact.Fields("Mercaderia") = rsDetFact!mERCADERIA
        TrsDetFact.Fields("Procedencia") = rsDetFact!pROCEDENCIA
        TrsDetFact.Fields("Destino") = rsDetFact!dESTINO
        TrsDetFact.Fields("Kilos") = rsDetFact!kilos
        TrsDetFact.Fields("Tarifa") = rsDetFact!tarifa
        TrsDetFact.Fields("Stotal") = rsDetFact!STotal
        TrsDetFact.Fields("Cupo") = rsDetFact!Cupo
        TrsDetFact.Fields("ConceptoNC") = rsDetFact!ConceptoNC
        TrsDetFact.Update
        rsDetFact.MoveNext
    Loop
      'Dim frmRep As New InfFactura
            
        'frmRep.Show vbModal
End If
End Sub

Private Sub Comp_LostFocus()
Select Case Comp.ListIndex
    Case 0: VtipoComp = 1
End Select
End Sub

Private Sub Form_Load()
On Error Resume Next
Comprobantes.ListItems.Clear
Comp.AddItem "Factura"
Comp.AddItem "Nota de Credito"
Comp.AddItem "Nota de Debito"
Comp.AddItem "Factura Pyme"
Comp.AddItem "Nota de Credito Pyme"
Comp.AddItem " Nota de Debito Pyme"
Comp.AddItem "Liquido Producto"
Comp.AddItem "Factura B"
Comp.AddItem "NC Liquido Producto"
Comp.ListIndex = 0
Desde = Date
Desde.Mask = "##/##/####"
Hasta = Date
Hasta.Mask = "##/##/####"
PtoVta = "0004"
If FE.iniciar(modoFiscal_Fiscal, "30709381683", App.Path + "\Certificado\Certificado.pfx", App.Path + "\Certificado\WSAFIPFE.lic") Then
    FE.ArchivoCertificadoPassword = "hercasa1509"
    If FE.f1ObtenerTicketAcceso() Then
        MsgBox "Sistema conectado al Servidor de AFIP"
    Else
        MsgBox ("fallo acceso " + FE.UltimoMensajeError)
        Exit Sub
    End If
Else
    MsgBox ("fallo iniciar " + FE.UltimoMensajeError)
    Exit Sub
End If

End Sub

