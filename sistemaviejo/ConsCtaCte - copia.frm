VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Begin VB.Form ConsCtaCte 
   Caption         =   "Consulta Cta Cte Empresas"
   ClientHeight    =   5865
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   11235
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   5865
   ScaleWidth      =   11235
   Begin VB.Frame FCtaCte 
      Height          =   5775
      Left            =   0
      TabIndex        =   4
      Top             =   0
      Width           =   11175
      Begin VB.CommandButton Imprimir 
         Caption         =   "Imprimir"
         Height          =   375
         Left            =   8520
         TabIndex        =   10
         Top             =   240
         Width           =   1455
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   0
         Left            =   1560
         TabIndex        =   0
         Text            =   "Text6"
         Top             =   240
         Width           =   855
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   1
         Left            =   2520
         TabIndex        =   5
         Text            =   "Text6"
         Top             =   240
         Width           =   4095
      End
      Begin VB.CommandButton Command1 
         Caption         =   "Consultar"
         Height          =   375
         Left            =   6960
         TabIndex        =   3
         Top             =   240
         Width           =   1455
      End
      Begin MSMask.MaskEdBox FHasta 
         Height          =   285
         Left            =   3600
         TabIndex        =   2
         Top             =   720
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   503
         _Version        =   393216
         Appearance      =   0
         PromptChar      =   "_"
      End
      Begin MSMask.MaskEdBox FDesde 
         Height          =   285
         Left            =   1560
         TabIndex        =   1
         Top             =   720
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   503
         _Version        =   393216
         Appearance      =   0
         PromptChar      =   "_"
      End
      Begin MSComctlLib.ListView CtaCte 
         Height          =   4575
         Left            =   120
         TabIndex        =   6
         Top             =   1080
         Width           =   10905
         _ExtentX        =   19235
         _ExtentY        =   8070
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         GridLines       =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   8
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "CodComp"
            Object.Width           =   882
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Comprobante"
            Object.Width           =   3528
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Número"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Debe"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Haber"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   6
            Text            =   "Saldo"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   7
            Text            =   "Saldo Comp"
            Object.Width           =   2540
         EndProperty
      End
      Begin VB.Label Label35 
         Caption         =   "Cliente"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FF0000&
         Height          =   255
         Left            =   120
         TabIndex        =   9
         Top             =   240
         Width           =   1455
      End
      Begin VB.Label Label36 
         Caption         =   "Desde"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FF0000&
         Height          =   255
         Left            =   120
         TabIndex        =   8
         Top             =   720
         Width           =   1455
      End
      Begin VB.Label Label37 
         Caption         =   "Hasta"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FF0000&
         Height          =   255
         Left            =   3000
         TabIndex        =   7
         Top             =   720
         Width           =   1455
      End
   End
End
Attribute VB_Name = "ConsCtaCte"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Command1_Click()
Dim VSaldo As Double
Dim VsaldoInicial As Double
Dim VFDesde As Date
If FDesde.Text = "__/__/____" Or FHasta = "__/__/____" Then
    MsgBox "Debe ingresar fecha de consulta"
    Exit Sub
End If
If Text6(0) = "" Then
    MsgBox "Debe Ingresar un Fletero", vbInformation
    Exit Sub
End If
If Format(FDesde, "mm/dd/yyyy") > Format(FHasta, "mm/dd/yyyy") Then
    MsgBox "Fecha Desde No puede ser mayor que Fecha Hasta", vbInformation
    Exit Sub
End If
VFDesde = FDesde
VSaldo = 0
VsaldoInicial = 0
'CALCULA SALDO INICIAL
CtaCte.ListItems.Clear
Set rsCtaCteEmp = db.OpenRecordset("SELECT * FROM CtaCteEmp WHERE Fecha < #" & Format(FDesde, "mm/dd/yyyy") & "# AND CodEmp = " & Text6(0) & "")
Do While Not rsCtaCteEmp.EOF
    If Not rsCtaCteEmp!Debe = "" Then
        VFDesde = rsCtaCteEmp!Fecha
        VsaldoInicial = VsaldoInicial + rsCtaCteEmp!Debe
    End If
    If Not rsCtaCteEmp!Haber = "" Then
        VsaldoInicial = VsaldoInicial - rsCtaCteEmp!Haber
    End If
    rsCtaCteEmp.MoveNext
Loop
Set Lista = CtaCte.ListItems.Add(, , "")
Lista.SubItems(2) = "Saldo Inicial"
Lista.SubItems(6) = FormatNumber(VsaldoInicial)
Set rsCtaCteProv = Nothing
'BUSCA DETALLE DEL MAYOR
Set rsCtaCteEmp = db.OpenRecordset("SELECT * FROM CtaCteEmp WHERE CodEmp = " & Text6(0) & " AND Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " # ORDER BY Fecha")
VSaldo = VsaldoInicial
Do While Not rsCtaCteEmp.EOF
    Set Lista = CtaCte.ListItems.Add(, , rsCtaCteEmp!Fecha)
    Lista.Tag = rsCtaCteEmp!Fecha
    Lista.SubItems(1) = rsCtaCteEmp!TipoComp
    Set rsComprobantes = db.OpenRecordset("SELECT * FROM Comprobantes WHERE CodComp = " & rsCtaCteEmp!TipoComp & "")
    Lista.SubItems(2) = rsComprobantes!DescComp
    Set rsComprobantes = Nothing
    Vtamaño = Len(rsCtaCteEmp!PtoVta)
    Select Case Vtamaño
        Case 1: VPtoVta = "000" & rsCtaCteEmp!PtoVta
        Case 2: VPtoVta = "00" & rsCtaCteEmp!PtoVta
        Case 3: VPtoVta = "0" & rsCtaCteEmp!PtoVta
        Case 4: VPtoVta = rsCtaCteEmp!PtoVta
    End Select
    Vtamaño = Len(rsCtaCteEmp!NroComp)
    Select Case Vtamaño
        Case 1: VNroFact = "0000000" & rsCtaCteEmp!NroComp
        Case 2: VNroFact = "000000" & rsCtaCteEmp!NroComp
        Case 3: VNroFact = "00000" & rsCtaCteEmp!NroComp
        Case 4: VNroFact = "0000" & rsCtaCteEmp!NroComp
        Case 5: VNroFact = "000" & rsCtaCteEmp!NroComp
        Case 6: VNroFact = "00" & rsCtaCteEmp!NroComp
        Case 7: VNroFact = "0" & rsCtaCteEmp!NroComp
        Case 8: VNroFact = rsCtaCteEmp!NroComp
    End Select
    vdesccomp = VPtoVta & "-" & VNroFact
    Lista.SubItems(3) = vdesccomp
    If Not rsCtaCteEmp!Debe = "" Then
        Lista.SubItems(4) = FormatNumber(rsCtaCteEmp!Debe)
        VSaldo = VSaldo + rsCtaCteEmp!Debe
    End If
    If Not rsCtaCteEmp!Haber = "" Then
        Lista.SubItems(5) = FormatNumber(rsCtaCteEmp!Haber)
        VSaldo = VSaldo - rsCtaCteEmp!Haber
    End If
    Lista.SubItems(6) = FormatNumber(VSaldo)
    Lista.SubItems(7) = FormatNumber(rsCtaCteEmp!SaldoComp)
    rsCtaCteEmp.MoveNext
Loop

End Sub

Private Sub Form_Load()
i = 0
For i = i + 1 To Text6.Count
    Text6(i - 1) = ""
Next
CtaCte.ListItems.Clear
FDesde.Text = ""
FDesde.Mask = "##/##/####"
FHasta.Text = ""
FHasta.Mask = "##/##/####"
End Sub

Private Sub Imprimir_Click()
Dim LCtaCte As ListItem
Set TrsConsCtaCte = dbTemp.OpenRecordset("CtaCteEmp")
Set TrsConsultas = dbTemp.OpenRecordset("Consultas")

Do While Not TrsConsultas.EOF
    TrsConsultas.Delete
    TrsConsultas.MoveNext
Loop
Do While Not TrsConsCtaCte.EOF
    TrsConsCtaCte.Delete
    TrsConsCtaCte.MoveNext
Loop
TrsConsultas.AddNew
TrsConsultas.Fields("FDede") = FDesde
TrsConsultas.Fields("FHasta") = FHasta
TrsConsultas.Update
i = 0
For i = i + 1 To CtaCte.ListItems.Count
    Set LCtaCte = CtaCte.ListItems.Item(i)
    With TrsConsCtaCte
    If i = 1 Then
        .AddNew
        .Fields("CodEmp") = Text6(0)
        If LCtaCte.SubItems(6) < 0 Then
            .Fields("Haber") = LCtaCte.SubItems(6)
        Else
            .Fields("Debe") = LCtaCte.SubItems(6)
        End If
        .Fields("TipoComp") = LCtaCte.SubItems(2)
        .Fields("Saldo") = LCtaCte.SubItems(6)
        .Update
    Else
        .AddNew
        .Fields("Fecha") = LCtaCte.Tag
        .Fields("CodEmp") = Text6(0)
        .Fields("CodComp") = LCtaCte.SubItems(1)
        .Fields("TipoComp") = LCtaCte.SubItems(2)
        .Fields("NroComp") = LCtaCte.SubItems(3)
        If Not LCtaCte.SubItems(4) = "" Then
            .Fields("Debe") = LCtaCte.SubItems(4)
        End If
        If Not LCtaCte.SubItems(5) = "" Then
            .Fields("Haber") = LCtaCte.SubItems(5)
        End If
        .Fields("Saldo") = LCtaCte.SubItems(6)
        If Not LCtaCte.SubItems(7) = "" Then
            .Fields("SaldoComp") = LCtaCte.SubItems(7)
        End If
        .Update
    End If
    End With
Next
Dim frmRep As New InfConsCtaCteEmp
frmRep.Show vbModal
End Sub

Private Sub Text6_LostFocus(Index As Integer)
Select Case Index
    Case 0:
        If Not Text6(0) = "" Then
            Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas Where CodEmpresas = " & Text6(0) & "")
            If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
                Text6(1) = rsEmpresas.Fields("DescEmpresas")
                FDesde.SetFocus
            Else
                MsgBox "La empresa no existe", vbInformation
            End If
        Else
            Viene = "CtaCte"
            With BuscEmpresas
                .Show
                .Height = 3435
                .Width = 6030
                .Top = (Screen.Height - .Height) / 2
                .Left = (Screen.Width - .Width) / 2
            End With
        End If
End Select

End Sub
