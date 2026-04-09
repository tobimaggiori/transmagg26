VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form ConciliacionBancaria 
   BackColor       =   &H80000007&
   Caption         =   "Conciliacion Bancaria"
   ClientHeight    =   7620
   ClientLeft      =   120
   ClientTop       =   450
   ClientWidth     =   12765
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   7620
   ScaleWidth      =   12765
   Begin VB.CommandButton Command1 
      Caption         =   "Imprime Cheques Pendientes"
      Height          =   495
      Left            =   10320
      TabIndex        =   12
      Top             =   840
      Visible         =   0   'False
      Width           =   2055
   End
   Begin VB.CommandButton Grabar 
      Caption         =   "Grabar Conciliación"
      Height          =   495
      Left            =   7800
      TabIndex        =   10
      Top             =   840
      Visible         =   0   'False
      Width           =   2415
   End
   Begin VB.Frame TotGral 
      Caption         =   "Totales"
      Height          =   615
      Left            =   360
      TabIndex        =   5
      Top             =   6720
      Visible         =   0   'False
      Width           =   11895
      Begin VB.TextBox Text2 
         Height          =   285
         Index           =   2
         Left            =   9480
         TabIndex        =   9
         Text            =   "Text2"
         Top             =   240
         Width           =   1815
      End
      Begin VB.TextBox Text2 
         Height          =   285
         Index           =   1
         Left            =   7560
         TabIndex        =   8
         Text            =   "Text2"
         Top             =   240
         Width           =   1815
      End
      Begin VB.TextBox Text2 
         Height          =   285
         Index           =   0
         Left            =   5640
         TabIndex        =   7
         Text            =   "Text2"
         Top             =   240
         Width           =   1815
      End
      Begin VB.Label Label3 
         Caption         =   "Totales"
         Height          =   255
         Left            =   480
         TabIndex        =   6
         Top             =   240
         Width           =   1695
      End
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Left            =   1080
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   240
      Width           =   975
   End
   Begin MSComctlLib.ListView CtaCte 
      Height          =   5055
      Left            =   600
      TabIndex        =   4
      Top             =   1320
      Visible         =   0   'False
      Width           =   11490
      _ExtentX        =   20267
      _ExtentY        =   8916
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
         Text            =   "Comprobante"
         Object.Width           =   3528
      EndProperty
      BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   2
         Text            =   "Número"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   3
         Text            =   "Debe"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   4
         Text            =   "Haber"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   5
         Text            =   "Saldo"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   6
         Text            =   "Saldo Comp"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   7
         Text            =   "Obs"
         Object.Width           =   4410
      EndProperty
   End
   Begin MSComctlLib.ListView CtaCteC 
      Height          =   5055
      Left            =   600
      TabIndex        =   11
      Top             =   1320
      Visible         =   0   'False
      Width           =   11490
      _ExtentX        =   20267
      _ExtentY        =   8916
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
      NumItems        =   8
      BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         Text            =   "Fecha"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   1
         Text            =   "Comprobante"
         Object.Width           =   3528
      EndProperty
      BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   2
         Text            =   "Número"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   3
         Text            =   "Debe"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   4
         Text            =   "Haber"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   5
         Text            =   "Saldo"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   6
         Text            =   "Saldo Comp"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   7
         Text            =   "Obs"
         Object.Width           =   4410
      EndProperty
   End
   Begin MSComctlLib.TabStrip Estado 
      Height          =   6855
      Left            =   240
      TabIndex        =   3
      Top             =   600
      Width           =   12495
      _ExtentX        =   22040
      _ExtentY        =   12091
      _Version        =   393216
      BeginProperty Tabs {1EFB6598-857C-11D1-B16A-00C0F0283628} 
         NumTabs         =   1
         BeginProperty Tab1 {1EFB659A-857C-11D1-B16A-00C0F0283628} 
            ImageVarType    =   2
         EndProperty
      EndProperty
   End
   Begin VB.Label Label2 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      BorderStyle     =   1  'Fixed Single
      Caption         =   "Label2"
      ForeColor       =   &H80000008&
      Height          =   255
      Left            =   2160
      TabIndex        =   2
      Top             =   240
      Width           =   4095
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Cuenta"
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Left            =   240
      TabIndex        =   0
      Top             =   240
      Width           =   735
   End
End
Attribute VB_Name = "ConciliacionBancaria"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Private Sub Command1_Click()
On Error Resume Next
Set TrsConsultas = dbTemp.OpenRecordset("Select * From Consultas")
Do While Not TrsConsultas.EOF
    TrsConsultas.Delete
    TrsConsultas.MoveNext
Loop
TrsConsultas.AddNew
'TrsConsultas.Fields("FDede") = FDesde
'TrsConsultas.Fields("FHasta") = FHasta
'TrsConsultas.Update
Set TrsCHEmitidos = dbTemp.OpenRecordset("Select * From ChEmitidos")
Do While Not TrsCHEmitidos.EOF
    TrsCHEmitidos.Delete
    TrsCHEmitidos.MoveNext
Loop

Set rsCtaCteBco = db.OpenRecordset("SELECT * FROM CtaCtebco WHERE CtaCte = '" & Text1 & "' AND Conciliado = False  ORDER BY Fecha")
Do While Not rsCtaCteBco.EOF
If rsCtaCteBco!CodComp = 1 Or rsCtaCteBco!CodComp = 11 Then
Set rsCHEmitidos = db.OpenRecordset("SELECT * FROM ChEmitidos WHERE NroComp = " & rsCtaCteBco!NroMov & " ORDER BY NroComp")
    With TrsCHEmitidos
    .AddNew
    .Fields("Fecha") = rsCtaCteBco!Fecha
    .Fields("CtaCte") = rsCtaCteBco!CtaCte
    .Fields("NroComp") = rsCtaCteBco!NroComp
    .Fields("Importe") = rsCtaCteBco!Haber
    .Fields("FEmision") = rsCtaCteBco!Fecha
    If Not IsNull(rsCHEmitidos!Dado) Then
    .Fields("Dado") = rsCHEmitidos!Dado
    End If
    .Update

End With
End If
rsCtaCteBco.MoveNext
Loop
Dim frmRep As New InfCHEmitidos
frmRep.Show vbModal

End Sub

Private Sub Estado_Click()
Dim VSaldo As Double
Dim VsaldoInicial As Double
Dim VFDesde As Date
Dim TDebe As Double
Dim THaber As Double
On Error Resume Next
If Text1 = "" Then
    MsgBox "Debe Ingresar una cuenta", vbInformation
    Exit Sub
End If
If Estado.SelectedItem.Index = 1 Then ' general
    CtaCte.Visible = True
    CtaCteC.Visible = False
    TotGral.Visible = True
    Grabar.Visible = False
    Command1.Visible = False
    VSaldo = 0
    VsaldoInicial = 0
    'CALCULA SALDO INICIAL
    CtaCte.ListItems.Clear
    Set Lista = CtaCte.ListItems.Add(, , "")
    Lista.SubItems(2) = "Saldo Inicial"
    Lista.SubItems(5) = FormatNumber(VsaldoInicial)
    Set rsCtaCteProv = Nothing
    Set rsCtaCteBco = db.OpenRecordset("SELECT * FROM CtaCtebco WHERE CtaCte = '" & Text1 & "' ORDER BY Fecha")
    VSaldo = VsaldoInicial
    Do While Not rsCtaCteBco.EOF
        Set Lista = CtaCte.ListItems.Add(, , rsCtaCteBco!Fecha)
        Lista.Tag = rsCtaCteBco!Fecha
        'Lista.SubItems(1) = rsCtaCteBco!CodComp
        Set rsConsBco = db.OpenRecordset("SELECT * FROM ConceptoBco WHERE CodConcepto = " & rsCtaCteBco!CodComp & "")
        Lista.SubItems(1) = rsConsBco!descconcepto
        Set rsComprobantes = Nothing
        Lista.SubItems(2) = rsCtaCteBco!NroMov
        If Not rsCtaCteBco!Debe = "" Then
            Lista.SubItems(3) = FormatNumber(rsCtaCteBco!Debe)
            VSaldo = VSaldo + rsCtaCteBco!Debe
            TDebe = TDebe + rsCtaCteBco!Debe
        End If
        If Not rsCtaCteBco!Haber = "" Then
            Lista.SubItems(4) = FormatNumber(rsCtaCteBco!Haber)
            VSaldo = VSaldo - rsCtaCteBco!Haber
            THaber = THaber + rsCtaCteBco!Haber
        End If
        Lista.SubItems(5) = FormatNumber(VSaldo)
        Lista.SubItems(6) = rsCtaCteBco!Obs
        ' Lista.SubItems(7) = FormatNumber(rsCtaCteBco!SaldoComp)
        rsCtaCteBco.MoveNext
    Loop
    Text2(0) = FormatNumber(TDebe)
    Text2(1) = FormatNumber(THaber)
    Text2(2) = FormatNumber(VSaldo)
End If

If Estado.SelectedItem.Index = 2 Then ' conciliado
    CtaCte.Visible = True
    CtaCteC.Visible = False
    TotGral.Visible = True
    Grabar.Visible = False
    Command1.Visible = False
    VSaldo = 0
    VsaldoInicial = 0
    'CALCULA SALDO INICIAL
    CtaCte.ListItems.Clear
    Set Lista = CtaCte.ListItems.Add(, , "")
    Lista.SubItems(2) = "Saldo Inicial"
    Lista.SubItems(5) = FormatNumber(VsaldoInicial)
    Set rsCtaCteProv = Nothing
    Set rsCtaCteBco = db.OpenRecordset("SELECT * FROM CtaCtebco WHERE CtaCte = '" & Text1 & "' AND Conciliado = True  ORDER BY Fecha")
    VSaldo = VsaldoInicial
    Do While Not rsCtaCteBco.EOF
        Set Lista = CtaCte.ListItems.Add(, , rsCtaCteBco!Fecha)
        Lista.Tag = rsCtaCteBco!Fecha
        'Lista.SubItems(1) = rsCtaCteBco!CodComp
        Set rsConsBco = db.OpenRecordset("SELECT * FROM ConceptoBco WHERE CodConcepto = " & rsCtaCteBco!CodComp & "")
        Lista.SubItems(1) = rsConsBco!descconcepto
        Set rsComprobantes = Nothing
        Lista.SubItems(2) = rsCtaCteBco!NroMov
        If Not rsCtaCteBco!Debe = "" Then
            Lista.SubItems(3) = FormatNumber(rsCtaCteBco!Debe)
            VSaldo = VSaldo + rsCtaCteBco!Debe
            TDebe = TDebe + rsCtaCteBco!Debe
        End If
        If Not rsCtaCteBco!Haber = "" Then
            Lista.SubItems(4) = FormatNumber(rsCtaCteBco!Haber)
            VSaldo = VSaldo - rsCtaCteBco!Haber
            THaber = THaber + rsCtaCteBco!Haber
        End If
        Lista.SubItems(5) = FormatNumber(VSaldo)
        Lista.SubItems(6) = rsCtaCteBco!Obs
        ' Lista.SubItems(7) = FormatNumber(rsCtaCteBco!SaldoComp)
        rsCtaCteBco.MoveNext
    Loop
    Text2(0) = FormatNumber(TDebe)
    Text2(1) = FormatNumber(THaber)
    Text2(2) = FormatNumber(VSaldo)
End If

If Estado.SelectedItem.Index = 3 Then ' conciliado
    CtaCteC.Visible = True
    CtaCte.Visible = False
    TotGral.Visible = True
    Grabar.Visible = True
    Command1.Visible = True
    VSaldo = 0
    VsaldoInicial = 0
    'CALCULA SALDO INICIAL
    CtaCteC.ListItems.Clear
    Set Lista = CtaCteC.ListItems.Add(, , "")
    Lista.SubItems(2) = "Saldo Inicial"
    Lista.SubItems(5) = FormatNumber(VsaldoInicial)
    Set rsCtaCteProv = Nothing
    Set rsCtaCteBco = db.OpenRecordset("SELECT * FROM CtaCtebco WHERE CtaCte = '" & Text1 & "' AND Conciliado = False  ORDER BY Fecha")
    VSaldo = VsaldoInicial
    Do While Not rsCtaCteBco.EOF
        Set Lista = CtaCteC.ListItems.Add(, , rsCtaCteBco!Fecha)
        Lista.Tag = rsCtaCteBco!Fecha
        'Lista.SubItems(1) = rsCtaCteBco!CodComp
        Set rsConsBco = db.OpenRecordset("SELECT * FROM ConceptoBco WHERE CodConcepto = " & rsCtaCteBco!CodComp & "")
        Lista.SubItems(1) = rsConsBco!descconcepto
        Set rsComprobantes = Nothing
        Lista.SubItems(2) = rsCtaCteBco!NroMov
        If Not rsCtaCteBco!Debe = "" Then
            Lista.SubItems(3) = FormatNumber(rsCtaCteBco!Debe)
            VSaldo = VSaldo + rsCtaCteBco!Debe
            TDebe = TDebe + rsCtaCteBco!Debe
        End If
        If Not rsCtaCteBco!Haber = "" Then
            Lista.SubItems(4) = FormatNumber(rsCtaCteBco!Haber)
            VSaldo = VSaldo - rsCtaCteBco!Haber
            THaber = THaber + rsCtaCteBco!Haber
        End If
        Lista.SubItems(5) = FormatNumber(VSaldo)
        Lista.SubItems(6) = rsCtaCteBco!Obs
        ' Lista.SubItems(7) = FormatNumber(rsCtaCteBco!SaldoComp)
        rsCtaCteBco.MoveNext
    Loop
    Text2(0) = FormatNumber(TDebe)
    Text2(1) = FormatNumber(THaber)
    Text2(2) = FormatNumber(VSaldo)
End If

End Sub

Private Sub Form_Load()
Text1 = ""
Label2 = ""
Estado.Tabs.Clear
Estado.Tabs.Add , , "General"
Estado.Tabs.Add , , "Conciliado"
Estado.Tabs.Add , , "Pendiente"
End Sub

Private Sub Grabar_Click()
Dim i As Integer
On Error Resume Next
i = 0
For i = i + 1 To CtaCteC.ListItems.Count
    If CtaCteC.ListItems.Item(i).Checked = True Then
        Set Lista = CtaCteC.ListItems.Item(i)
        Set rsCtaCteBco = db.OpenRecordset("SELECT * FROM CtaCtebco WHERE CtaCte = '" & Text1 & "' AND NroMov = " & Lista.SubItems(2) & "")
        Do While Not rsCtaCteBco.EOF
        rsCtaCteBco.Edit
        rsCtaCteBco!Conciliado = True
        rsCtaCteBco.Update
        rsCtaCteBco.MoveNext
        Loop
    End If
Next
Dim VSaldo As Double
Dim VsaldoInicial As Double
Dim VFDesde As Date
Dim TDebe As Double
Dim THaber As Double
 CtaCteC.Visible = True
    CtaCte.Visible = False
    TotGral.Visible = True
    Grabar.Visible = True
    VSaldo = 0
    VsaldoInicial = 0
    'CALCULA SALDO INICIAL
    CtaCteC.ListItems.Clear
    Set Lista = CtaCteC.ListItems.Add(, , "")
    Lista.SubItems(2) = "Saldo Inicial"
    Lista.SubItems(5) = FormatNumber(VsaldoInicial)
    Set rsCtaCteProv = Nothing
    Set rsCtaCteBco = db.OpenRecordset("SELECT * FROM CtaCtebco WHERE CtaCte = '" & Text1 & "' AND Conciliado = False  ORDER BY Fecha")
    VSaldo = VsaldoInicial
    Do While Not rsCtaCteBco.EOF
        Set Lista = CtaCteC.ListItems.Add(, , rsCtaCteBco!Fecha)
        Lista.Tag = rsCtaCteBco!Fecha
        'Lista.SubItems(1) = rsCtaCteBco!CodComp
        Set rsConsBco = db.OpenRecordset("SELECT * FROM ConceptoBco WHERE CodConcepto = " & rsCtaCteBco!CodComp & "")
        Lista.SubItems(1) = rsConsBco!descconcepto
        Set rsComprobantes = Nothing
        Lista.SubItems(2) = rsCtaCteBco!NroMov
        If Not rsCtaCteBco!Debe = "" Then
            Lista.SubItems(3) = FormatNumber(rsCtaCteBco!Debe)
            VSaldo = VSaldo + rsCtaCteBco!Debe
            TDebe = TDebe + rsCtaCteBco!Debe
        End If
        If Not rsCtaCteBco!Haber = "" Then
            Lista.SubItems(4) = FormatNumber(rsCtaCteBco!Haber)
            VSaldo = VSaldo - rsCtaCteBco!Haber
            THaber = THaber + rsCtaCteBco!Haber
        End If
        Lista.SubItems(5) = FormatNumber(VSaldo)
        If Not rsCtaCteBco!Obs = "" Then
        Lista.SubItems(6) = rsCtaCteBco!Obs
        End If
        ' Lista.SubItems(7) = FormatNumber(rsCtaCteBco!SaldoComp)
        rsCtaCteBco.MoveNext
    Loop
    Text2(0) = FormatNumber(TDebe)
    Text2(1) = FormatNumber(THaber)
    Text2(2) = FormatNumber(VSaldo)

End Sub

Private Sub Text1_LostFocus()
If Not Text1 = "" Then
    Set rsCtaBcoPropias = db.OpenRecordset("Select * from CtaCtePropias Where CtaCte = '" & Text1 & "'")
    If Not rsCtaBcoPropias.EOF And Not rsCtaBcoPropias.BOF Then
        Label2 = rsCtaBcoPropias!DescBco
    Else
        MsgBox "La Cuenta no Existe", vbInformation
        Text1.SetFocus
    End If
End If
End Sub
