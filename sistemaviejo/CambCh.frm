VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Begin VB.Form CambCh 
   BackColor       =   &H80000007&
   Caption         =   "Mutuos Cheques"
   ClientHeight    =   7185
   ClientLeft      =   60
   ClientTop       =   390
   ClientWidth     =   12780
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   7185
   ScaleWidth      =   12780
   Begin VB.Frame Frame1 
      BackColor       =   &H80000012&
      Caption         =   "Cheques Mutuo"
      ForeColor       =   &H8000000E&
      Height          =   6855
      Left            =   6480
      TabIndex        =   1
      Top             =   120
      Width           =   6255
      Begin VB.TextBox Text1 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   7
         Left            =   4200
         TabIndex        =   30
         Text            =   "Text1"
         Top             =   5160
         Width           =   1335
      End
      Begin VB.CommandButton Command2 
         Caption         =   "Grabar Mutuo"
         Height          =   375
         Left            =   840
         TabIndex        =   27
         Top             =   6240
         Width           =   4455
      End
      Begin VB.CommandButton Command1 
         BackColor       =   &H80000010&
         Caption         =   "Agregar"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   400
            Underline       =   -1  'True
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   285
         Left            =   4800
         MaskColor       =   &H000080FF&
         TabIndex        =   23
         Top             =   1440
         Width           =   975
      End
      Begin MSMask.MaskEdBox FVto 
         Height          =   285
         Left            =   960
         TabIndex        =   21
         Top             =   1440
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   503
         _Version        =   393216
         Appearance      =   0
         PromptChar      =   "_"
      End
      Begin VB.TextBox Text1 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   6
         Left            =   3360
         TabIndex        =   22
         Text            =   "Text1"
         Top             =   1440
         Width           =   1335
      End
      Begin VB.TextBox Text1 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   5
         Left            =   4800
         TabIndex        =   20
         Text            =   "Text1"
         Top             =   1080
         Width           =   975
      End
      Begin VB.TextBox Text1 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   4
         Left            =   1200
         TabIndex        =   19
         Text            =   "Text1"
         Top             =   1080
         Width           =   2535
      End
      Begin VB.TextBox Text1 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   3
         Left            =   720
         TabIndex        =   18
         Text            =   "Text1"
         Top             =   1080
         Width           =   375
      End
      Begin VB.TextBox Text1 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   2
         Left            =   1680
         TabIndex        =   17
         Text            =   "Text1"
         Top             =   720
         Width           =   4095
      End
      Begin VB.TextBox Text1 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   1
         Left            =   960
         TabIndex        =   16
         Text            =   "Text1"
         Top             =   720
         Width           =   615
      End
      Begin VB.TextBox Text1 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   0
         Left            =   960
         TabIndex        =   14
         Text            =   "Text1"
         Top             =   360
         Width           =   1095
      End
      Begin MSComctlLib.ListView ChMutuo 
         Height          =   2655
         Left            =   120
         TabIndex        =   24
         Top             =   1920
         Width           =   6000
         _ExtentX        =   10583
         _ExtentY        =   4683
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   4
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Banco"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Nro Cheque"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Fecha Vto"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Importe"
            Object.Width           =   2540
         EndProperty
      End
      Begin MSMask.MaskEdBox FMutuo 
         Height          =   285
         Left            =   3120
         TabIndex        =   15
         Top             =   360
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   503
         _Version        =   393216
         Appearance      =   0
         PromptChar      =   "_"
      End
      Begin VB.Label Label12 
         Appearance      =   0  'Flat
         BackColor       =   &H80000005&
         ForeColor       =   &H80000008&
         Height          =   255
         Index           =   1
         Left            =   4200
         TabIndex        =   32
         Top             =   5520
         Width           =   1335
      End
      Begin VB.Label Label11 
         BackColor       =   &H80000012&
         Caption         =   "Total Recibido"
         ForeColor       =   &H8000000F&
         Height          =   255
         Index           =   2
         Left            =   120
         TabIndex        =   31
         Top             =   5520
         Width           =   2535
      End
      Begin VB.Label Label11 
         BackColor       =   &H80000012&
         Caption         =   "Comisiones Ganaddas"
         ForeColor       =   &H8000000F&
         Height          =   255
         Index           =   1
         Left            =   120
         TabIndex        =   29
         Top             =   5160
         Width           =   2535
      End
      Begin VB.Label Label13 
         BackColor       =   &H80000012&
         Caption         =   "Fecha"
         ForeColor       =   &H8000000F&
         Height          =   255
         Left            =   2520
         TabIndex        =   28
         Top             =   360
         Width           =   735
      End
      Begin VB.Label Label12 
         Appearance      =   0  'Flat
         BackColor       =   &H80000005&
         ForeColor       =   &H80000008&
         Height          =   255
         Index           =   0
         Left            =   4200
         TabIndex        =   26
         Top             =   4800
         Width           =   1335
      End
      Begin VB.Label Label11 
         BackColor       =   &H80000012&
         Caption         =   "Total Cheques Mutuo"
         ForeColor       =   &H8000000F&
         Height          =   255
         Index           =   0
         Left            =   120
         TabIndex        =   25
         Top             =   4800
         Width           =   2535
      End
      Begin VB.Label Label10 
         BackColor       =   &H80000012&
         Caption         =   "Importe"
         ForeColor       =   &H8000000F&
         Height          =   255
         Left            =   2760
         TabIndex        =   13
         Top             =   1440
         Width           =   735
      End
      Begin VB.Label Label9 
         BackColor       =   &H80000012&
         Caption         =   "FechaVto"
         ForeColor       =   &H8000000F&
         Height          =   255
         Left            =   120
         TabIndex        =   12
         Top             =   1440
         Width           =   735
      End
      Begin VB.Label Label8 
         BackColor       =   &H80000012&
         Caption         =   "Nro Cheque"
         ForeColor       =   &H8000000F&
         Height          =   255
         Left            =   3840
         TabIndex        =   11
         Top             =   1080
         Width           =   975
      End
      Begin VB.Label Label7 
         BackColor       =   &H80000012&
         Caption         =   "Banco"
         ForeColor       =   &H8000000F&
         Height          =   255
         Left            =   120
         TabIndex        =   10
         Top             =   1080
         Width           =   735
      End
      Begin VB.Label Label6 
         BackColor       =   &H80000012&
         Caption         =   "Nro Muto"
         ForeColor       =   &H8000000F&
         Height          =   255
         Left            =   120
         TabIndex        =   9
         Top             =   360
         Width           =   735
      End
      Begin VB.Label Label5 
         BackColor       =   &H80000012&
         Caption         =   "Empresa"
         ForeColor       =   &H8000000F&
         Height          =   255
         Left            =   120
         TabIndex        =   8
         Top             =   720
         Width           =   735
      End
   End
   Begin VB.Frame ChequesCartera 
      BackColor       =   &H80000007&
      Caption         =   "Cheques en Cartera"
      ForeColor       =   &H8000000E&
      Height          =   6855
      Left            =   120
      TabIndex        =   0
      Top             =   120
      Width           =   6255
      Begin MSComctlLib.ListView ChCartera 
         Height          =   2415
         Left            =   120
         TabIndex        =   2
         Top             =   480
         Width           =   6000
         _ExtentX        =   10583
         _ExtentY        =   4260
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   4
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Banco"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Nro Cheque"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Fecha Vto"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Importe"
            Object.Width           =   2540
         EndProperty
      End
      Begin MSComctlLib.ListView ChSelect 
         Height          =   2415
         Left            =   120
         TabIndex        =   5
         Top             =   3600
         Width           =   5955
         _ExtentX        =   10504
         _ExtentY        =   4260
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         GridLines       =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   4
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Banco"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Nro Cheque"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Fecha Vto"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Importe"
            Object.Width           =   2540
         EndProperty
      End
      Begin VB.Label Label4 
         BackColor       =   &H80000012&
         Caption         =   "Total Cheques Seleccionado"
         ForeColor       =   &H8000000F&
         Height          =   255
         Left            =   240
         TabIndex        =   7
         Top             =   6120
         Width           =   2535
      End
      Begin VB.Label Label3 
         Appearance      =   0  'Flat
         BackColor       =   &H80000005&
         ForeColor       =   &H80000008&
         Height          =   255
         Left            =   4320
         TabIndex        =   6
         Top             =   6120
         Width           =   1335
      End
      Begin VB.Label Label2 
         BackColor       =   &H80000012&
         Caption         =   "Total Cheques En Cartera"
         ForeColor       =   &H8000000F&
         Height          =   255
         Left            =   360
         TabIndex        =   4
         Top             =   3000
         Width           =   2535
      End
      Begin VB.Label Label1 
         Appearance      =   0  'Flat
         BackColor       =   &H80000005&
         ForeColor       =   &H80000008&
         Height          =   255
         Left            =   4320
         TabIndex        =   3
         Top             =   3000
         Width           =   1335
      End
   End
End
Attribute VB_Name = "CambCh"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private LCHTer As ListItem
Private LCHSelect As ListItem
Private LCHMutuo As ListItem
Private TChCar As Double
Private TCHSelect As Double
Private TCHMutuo As Double
Private TCHRec As Double

Private Sub ChCartera_DblClick()
Set LCHTer = ChCartera.ListItems.Item(ChCartera.SelectedItem.Index)
Set LCHSelect = ChSelect.ListItems.Add(, , LCHTer.Tag)
LCHSelect.Tag = LCHTer.Tag
LCHSelect.SubItems(1) = LCHTer.SubItems(1)
LCHSelect.SubItems(2) = LCHTer.SubItems(2)
LCHSelect.SubItems(3) = FormatNumber(LCHTer.SubItems(3))
TCHSelect = TCHSelect + LCHTer.SubItems(3)
TChCar = TChCar - LCHTer.SubItems(3)
Label1 = FormatNumber(TChCar)
Label3 = FormatNumber(TCHSelect)
ChCartera.ListItems.Remove (ChCartera.SelectedItem.Index)

End Sub

Private Sub ChMutuo_DblClick()
Set LCHMutuo = ChMutuo.ListItems.Item(ChMutuo.SelectedItem.Index)
Text1(4) = LCHMutuo.Tag
Set rsBcos = db.OpenRecordset("Select * From Bancos Where DescBco = '" & LCHMutuo.Tag & "'")
Text1(3) = rsBcos!CodBco

Text1(5) = LCHMutuo.SubItems(1)
FVto = LCHMutuo.SubItems(2)
Text1(6) = LCHMutuo.SubItems(3)
TCHMutuo = TCHMutuo - Text1(6)
Label12(0) = FormatNumber(TCHMutuo)
ChMutuo.ListItems.Remove (ChMutuo.SelectedItem.Index)
Text1(3).SetFocus

End Sub

Private Sub ChSelect_DblClick()
Set LCHSelect = ChSelect.ListItems.Item(ChSelect.SelectedItem.Index)
Set LCHTer = ChCartera.ListItems.Add(, , LCHSelect.Tag)
LCHTer.Tag = LCHSelect.Tag
LCHTer.SubItems(1) = LCHSelect.SubItems(1)
LCHTer.SubItems(2) = LCHSelect.SubItems(2)
LCHTer.SubItems(3) = FormatNumber(LCHSelect.SubItems(3))
TChCar = TChCar + LCHSelect.SubItems(3)
TCHSelect = TCHSelect - LCHSelect.SubItems(3)
Label1 = FormatNumber(TChCar)
Label3 = FormatNumber(TCHSelect)
ChSelect.ListItems.Remove (ChSelect.SelectedItem.Index)
End Sub

Private Sub Command1_Click()
Set LCHMutuo = ChMutuo.ListItems.Add(, , Text1(4))
LCHMutuo.Tag = Text1(4)
LCHMutuo.SubItems(1) = Text1(5)
LCHMutuo.SubItems(2) = FVto
LCHMutuo.SubItems(3) = FormatNumber(Text1(6))
TCHRec = TCHRec + Text1(6)
TCHMutuo = TCHRec + FormatNumber(Text1(7))
Label12(0) = FormatNumber(TCHRec)
Label12(1) = FormatNumber(TCHMutuo)
i = 3
For i = i + 1 To Text1.Count
    If Not i = 8 Then
    Text1(i - 1) = ""
    End If
Next

FVto.Mask = ""
FVto.Text = ""
FVto.Mask = "##/##/####"
Text1(3).SetFocus
End Sub

Private Sub Command2_Click()
If FormatNumber(TCHSelect) = FormatNumber(TCHMutuo) Then
    'actualiza estado cheques en cartera
    i = 0
    For i = i + 1 To ChSelect.ListItems.Count
        Set LCHSelect = ChSelect.ListItems.Item(i)
        Set rsChTer = db.OpenRecordset("Select * From ChequesTerc Where NroCh = " & LCHSelect.SubItems(1) & "")
        rsChTer.Edit
        rsChTer!Estado = "Mutuo"
        rsChTer!Dado = Text1(2)
        rsChTer!NroRec = Text1(0)
        rsChTer!FEntregado = FMutuo
        rsChTer.Update
    Next
    Set rsChTer = Nothing
    'agrega cheques mutuo
    i = 0
    Set rsChTer = db.OpenRecordset("ChequesTerc")
    For i = i + 1 To ChMutuo.ListItems.Count
        Set LCHMutuo = ChMutuo.ListItems.Item(i)
        With rsChTer
            .AddNew
            Set rsBcos = db.OpenRecordset("Select * From Bancos Where DescBco = '" & LCHMutuo.Tag & "'")
            .Fields("CodBanco") = rsBcos!CodBco
            Set rsBcos = Nothing
            .Fields("NroCH") = LCHMutuo.SubItems(1)
            .Fields("FechaVto") = LCHMutuo.SubItems(2)
            .Fields("Importe") = LCHMutuo.SubItems(3)
            .Fields("Estado") = "En Cartera"
            .Fields("Entregado") = Text1(2)
            .Fields("FRecibido") = FMutuo
            .Update
        End With
    Next
    'graba encabezado mutuo
    Set rsEncabMutuo = db.OpenRecordset("EncabMutuo")
    With rsEncabMutuo
        .AddNew
        .Fields("Nro") = Text1(0)
        .Fields("Fecha") = FMutuo
        .Fields("CodEmpresa") = Text1(1)
        .Fields("Total") = FormatNumber(TCHMutuo)
        .Fields("TotalCHEnt") = FormatNumber(Label3)
        .Fields("TotalCHRec") = FormatNumber(Label12(0))
        .Fields("TotalComis") = FormatNumber(Text1(7))
        .Update
    End With
    'graba cheques recibidos
    Set rsCHRecMutuo = db.OpenRecordset("CHRecMutuo")
    i = 0
    For i = i + 1 To ChMutuo.ListItems.Count
        Set LCHMutuo = ChMutuo.ListItems.Item(i)
        With rsCHRecMutuo
            .AddNew
            .Fields("NroMutuo") = Text1(0)
            Set rsBcos = db.OpenRecordset("Select * From Bancos Where DescBco = '" & LCHMutuo.Tag & "'")
            .Fields("CobBco") = rsBcos!CodBco
            Set rsBcos = Nothing
            .Fields("NroCH") = LCHMutuo.SubItems(1)
            .Fields("FechaVto") = LCHMutuo.SubItems(2)
            .Fields("Importe") = LCHMutuo.SubItems(3)
            .Update
        End With
    Next
    'graba cheques entregados
    Set rsCHEntMutuo = db.OpenRecordset("CHEntMutuo")
    i = 0
    For i = i + 1 To ChSelect.ListItems.Count
        Set LCHSelect = ChSelect.ListItems.Item(i)
        With rsCHEntMutuo
            .AddNew
            .Fields("NroMutuo") = Text1(0)
            Set rsBcos = db.OpenRecordset("Select * From Bancos Where DescBco = '" & LCHSelect.Tag & "'")
            .Fields("CodBco") = rsBcos!CodBco
            Set rsBcos = Nothing
            .Fields("NroCH") = LCHSelect.SubItems(1)
            .Fields("FechaVto") = LCHSelect.SubItems(2)
            .Fields("Importe") = LCHSelect.SubItems(3)
            .Update
        End With
    Next
    'limpia campos
    Call Form_Load
End If
End Sub

Private Sub Form_Load()
TChCar = 0: TCHSelect = 0: TCHMutuo = 0: TCHRec = 0
Label1 = "0.00"
Label3 = "0.00"
Label12(0) = "0.00"
Label12(1) = "0.00"
FVto.Mask = ""
FVto.Text = ""
FVto.Mask = "##/##/####"
FMutuo.Mask = ""
FMutuo.Text = ""
FMutuo.Mask = "##/##/####"
ChCartera.ListItems.Clear
ChSelect.ListItems.Clear
ChMutuo.ListItems.Clear
i = 0
For i = i + 1 To Text1.Count
    Text1(i - 1) = ""
Next
Text1(7) = "0.00"
Set rsChTer = db.OpenRecordset("Select * From ChequesTerc Where Estado = 'En Cartera'")
Do While Not rsChTer.EOF
    Set rsBcos = db.OpenRecordset("Select * From Bancos Where CodBco = " & rsChTer!CodBanco & "")
    Set LCHTer = ChCartera.ListItems.Add(, , rsBcos!DescBco)
    LCHTer.Tag = rsBcos!DescBco
    Set rsBcos = Nothing
    LCHTer.SubItems(1) = rsChTer!NroCH
    LCHTer.SubItems(2) = rsChTer!FechaVto
    LCHTer.SubItems(3) = FormatNumber(rsChTer!Importe)
    TChCar = TChCar + rsChTer!Importe
    rsChTer.MoveNext
Loop
Label1.Caption = FormatNumber(TChCar)
End Sub

Private Sub FVto_LostFocus()
If IsDate(FVto) = False Then
    MsgBox ("Fecha Invalida")
    FVto.SetFocus
End If
End Sub

Private Sub Text1_LostFocus(Index As Integer)
Select Case Index:
Case 1:
    Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & Text1(1) & "")
    If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
        Text1(2) = rsEmpresas!DescEmpresas
    Else
        MsgBox "La empresa no existe"
    End If
    Set rsEmpresas = Nothing
Case 3:
    If Not Text1(3) = "" Then
    Set rsBcos = db.OpenRecordset("Select * From Bancos Where CodBco = " & Text1(3) & "")
    If Not rsBcos.EOF And Not rsBcos.BOF Then
        Text1(4) = rsBcos!DescBco
    Else
        MsgBox "El Banco no existe"
    End If
    Set rsBcos = Nothing
    End If
Case 7:
    TCHMutuo = TCHRec + Text1(7)
    Label12(1) = FormatNumber(TCHMutuo)
End Select
        
End Sub
