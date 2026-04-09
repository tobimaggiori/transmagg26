VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Begin VB.Form IngMovBanco 
   BackColor       =   &H80000007&
   Caption         =   "Ingreso Movimientos "
   ClientHeight    =   8025
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   8115
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   8025
   ScaleWidth      =   8115
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   7
      Left            =   1320
      TabIndex        =   43
      Text            =   "Text1"
      Top             =   1080
      Width           =   6255
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   6
      Left            =   3840
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   720
      Width           =   1335
   End
   Begin VB.CommandButton Command1 
      Caption         =   "Grabar"
      Height          =   375
      Left            =   6120
      TabIndex        =   7
      Top             =   1560
      Width           =   1575
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   6480
      TabIndex        =   19
      Text            =   "Text1"
      Top             =   720
      Width           =   1095
   End
   Begin VB.CommandButton Movimientos 
      Caption         =   "Movimientos"
      Height          =   375
      Left            =   4200
      TabIndex        =   6
      Top             =   1560
      Width           =   1455
   End
   Begin VB.CommandButton Retiro 
      Caption         =   "Extracción"
      Height          =   375
      Left            =   2280
      TabIndex        =   5
      Top             =   1560
      Width           =   1455
   End
   Begin VB.CommandButton Deposito 
      Caption         =   "Deposito"
      Height          =   375
      Left            =   360
      TabIndex        =   4
      Top             =   1560
      Width           =   1455
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   1080
      TabIndex        =   0
      Text            =   "Text1"
      Top             =   240
      Width           =   975
   End
   Begin MSMask.MaskEdBox Fecha 
      Height          =   285
      Left            =   1080
      TabIndex        =   1
      Top             =   720
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.Frame FMov 
      BackColor       =   &H80000006&
      Caption         =   "Movimientos de Ingreso y Egresos"
      ForeColor       =   &H000080FF&
      Height          =   3855
      Left            =   120
      TabIndex        =   25
      Top             =   2040
      Visible         =   0   'False
      Width           =   7815
      Begin VB.CommandButton Cargar 
         Caption         =   "Cargar"
         Height          =   255
         Left            =   6840
         TabIndex        =   29
         Top             =   480
         Width           =   855
      End
      Begin VB.OptionButton Option2 
         BackColor       =   &H80000006&
         Caption         =   "Egreso"
         ForeColor       =   &H000080FF&
         Height          =   195
         Index           =   1
         Left            =   4200
         TabIndex        =   33
         Top             =   960
         Width           =   1695
      End
      Begin VB.OptionButton Option2 
         BackColor       =   &H80000006&
         Caption         =   "Ingreso"
         ForeColor       =   &H000080FF&
         Height          =   195
         Index           =   0
         Left            =   2040
         TabIndex        =   32
         Top             =   960
         Width           =   1695
      End
      Begin MSComctlLib.ListView ListMov 
         Height          =   1815
         Left            =   480
         TabIndex        =   31
         Top             =   1320
         Width           =   6975
         _ExtentX        =   12303
         _ExtentY        =   3201
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
         NumItems        =   4
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Cod Mov"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Descripción"
            Object.Width           =   5292
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Importe"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Movimiento"
            Object.Width           =   2540
         EndProperty
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   4
         Left            =   5640
         TabIndex        =   28
         Text            =   "Text1"
         Top             =   480
         Width           =   1095
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   3
         Left            =   1200
         TabIndex        =   27
         Text            =   "Text1"
         Top             =   480
         Width           =   1095
      End
      Begin VB.Label Label12 
         BackColor       =   &H80000007&
         Caption         =   "Total Movimiento"
         ForeColor       =   &H000080FF&
         Height          =   255
         Left            =   2520
         TabIndex        =   35
         Top             =   3240
         Width           =   2775
      End
      Begin VB.Label Label11 
         BackColor       =   &H8000000E&
         BorderStyle     =   1  'Fixed Single
         Caption         =   "0.00"
         Height          =   255
         Left            =   5520
         TabIndex        =   34
         Top             =   3240
         Width           =   1455
      End
      Begin VB.Label Label10 
         BackColor       =   &H80000006&
         Caption         =   "Concepto"
         ForeColor       =   &H000080FF&
         Height          =   255
         Left            =   120
         TabIndex        =   30
         Top             =   480
         Width           =   975
      End
      Begin VB.Label Label9 
         BackColor       =   &H8000000E&
         BorderStyle     =   1  'Fixed Single
         Height          =   285
         Left            =   2400
         TabIndex        =   26
         Top             =   480
         Width           =   3135
      End
   End
   Begin VB.Frame FRetiro 
      BackColor       =   &H80000006&
      Caption         =   "Extracción"
      ForeColor       =   &H000080FF&
      Height          =   1455
      Left            =   120
      TabIndex        =   36
      Top             =   2040
      Visible         =   0   'False
      Width           =   7815
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   5
         Left            =   3960
         TabIndex        =   37
         Text            =   "Text1"
         Top             =   600
         Width           =   1095
      End
      Begin VB.Label Label13 
         BackColor       =   &H80000006&
         Caption         =   "Importe"
         ForeColor       =   &H000080FF&
         Height          =   255
         Left            =   2160
         TabIndex        =   38
         Top             =   600
         Width           =   1695
      End
   End
   Begin VB.Frame FDeposito 
      BackColor       =   &H80000007&
      Caption         =   "Deposito"
      ForeColor       =   &H000080FF&
      Height          =   6255
      Left            =   120
      TabIndex        =   9
      Top             =   2040
      Width           =   7815
      Begin VB.Frame FCHCartera 
         BackColor       =   &H00000000&
         Caption         =   "Cheques en Cartera"
         ForeColor       =   &H000080FF&
         Height          =   4695
         Left            =   120
         TabIndex        =   12
         Top             =   1080
         Width           =   7455
         Begin MSComctlLib.ListView CHCartera 
            Height          =   1575
            Left            =   240
            TabIndex        =   13
            Top             =   360
            Width           =   7000
            _ExtentX        =   12356
            _ExtentY        =   2778
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
            NumItems        =   5
            BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               Text            =   "Cod. Banco"
               Object.Width           =   1411
            EndProperty
            BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   1
               Text            =   "Banco"
               Object.Width           =   2540
            EndProperty
            BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   2
               Text            =   "Nro CH"
               Object.Width           =   2540
            EndProperty
            BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   3
               Text            =   "Fecha Vto"
               Object.Width           =   2540
            EndProperty
            BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   4
               Text            =   "Importe"
               Object.Width           =   2540
            EndProperty
         End
         Begin MSComctlLib.ListView CHDepositar 
            Height          =   1575
            Left            =   240
            TabIndex        =   14
            Top             =   2400
            Width           =   6975
            _ExtentX        =   12303
            _ExtentY        =   2778
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
            NumItems        =   5
            BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               Text            =   "Cod. Banco"
               Object.Width           =   1411
            EndProperty
            BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   1
               Text            =   "Banco"
               Object.Width           =   2540
            EndProperty
            BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   2
               Text            =   "Nro CH"
               Object.Width           =   2540
            EndProperty
            BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   3
               Text            =   "Fecha Vto"
               Object.Width           =   2540
            EndProperty
            BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   4
               Text            =   "Importe"
               Object.Width           =   2540
            EndProperty
         End
         Begin VB.Label Label17 
            Caption         =   "1101050"
            Height          =   255
            Left            =   3480
            TabIndex        =   42
            Top             =   2040
            Visible         =   0   'False
            Width           =   1815
         End
         Begin VB.Label Label6 
            BackColor       =   &H8000000E&
            BorderStyle     =   1  'Fixed Single
            Caption         =   "0.00"
            Height          =   255
            Left            =   5160
            TabIndex        =   18
            Top             =   4080
            Width           =   1455
         End
         Begin VB.Label Label7 
            BackColor       =   &H80000007&
            Caption         =   "Total Cheques"
            ForeColor       =   &H000080FF&
            Height          =   255
            Left            =   2520
            TabIndex        =   17
            Top             =   4080
            Width           =   2535
         End
         Begin VB.Label Label4 
            BackColor       =   &H80000007&
            Caption         =   "Cheques a Depositar"
            ForeColor       =   &H000080FF&
            Height          =   255
            Left            =   120
            TabIndex        =   15
            Top             =   2040
            Width           =   2055
         End
      End
      Begin VB.Frame Tipo 
         BackColor       =   &H80000007&
         Caption         =   "Tipo"
         ForeColor       =   &H000080FF&
         Height          =   735
         Left            =   120
         TabIndex        =   10
         Top             =   240
         Width           =   7215
         Begin VB.OptionButton Option1 
            BackColor       =   &H80000007&
            Caption         =   "Cheques"
            ForeColor       =   &H000080FF&
            Height          =   255
            Index           =   1
            Left            =   4200
            TabIndex        =   16
            Top             =   240
            Width           =   1695
         End
         Begin VB.OptionButton Option1 
            BackColor       =   &H80000007&
            Caption         =   "Efctivo"
            ForeColor       =   &H000080FF&
            Height          =   255
            Index           =   0
            Left            =   1320
            TabIndex        =   11
            Top             =   240
            Width           =   1695
         End
      End
      Begin VB.Frame FEfvo 
         BackColor       =   &H80000007&
         Caption         =   "Efectivo"
         ForeColor       =   &H000080FF&
         Height          =   975
         Left            =   120
         TabIndex        =   22
         Top             =   1080
         Visible         =   0   'False
         Width           =   7215
         Begin VB.TextBox Text1 
            Height          =   285
            Index           =   2
            Left            =   2520
            TabIndex        =   23
            Text            =   "Text1"
            Top             =   360
            Width           =   1815
         End
         Begin VB.Label Label16 
            Caption         =   "1101010"
            Height          =   255
            Left            =   4680
            TabIndex        =   41
            Top             =   360
            Visible         =   0   'False
            Width           =   1815
         End
         Begin VB.Label Label8 
            BackColor       =   &H80000007&
            Caption         =   "Total Efectivo:"
            ForeColor       =   &H000080FF&
            Height          =   255
            Left            =   840
            TabIndex        =   24
            Top             =   360
            Width           =   1695
         End
      End
   End
   Begin VB.Label Label3 
      BackColor       =   &H80000007&
      Caption         =   "Observaciones"
      ForeColor       =   &H000080FF&
      Height          =   255
      Index           =   1
      Left            =   120
      TabIndex        =   44
      Top             =   1080
      Width           =   1095
   End
   Begin VB.Label Label15 
      Caption         =   "Label15"
      Height          =   255
      Left            =   4200
      TabIndex        =   40
      Top             =   0
      Visible         =   0   'False
      Width           =   1695
   End
   Begin VB.Label Label14 
      BackColor       =   &H80000007&
      Caption         =   "Nro Comp"
      ForeColor       =   &H000080FF&
      Height          =   255
      Left            =   2520
      TabIndex        =   39
      Top             =   720
      Width           =   1215
   End
   Begin VB.Label Label3 
      BackColor       =   &H80000007&
      Caption         =   "Fecha"
      ForeColor       =   &H000080FF&
      Height          =   255
      Index           =   0
      Left            =   120
      TabIndex        =   21
      Top             =   720
      Width           =   855
   End
   Begin VB.Label Label5 
      BackColor       =   &H80000007&
      Caption         =   "Importe"
      ForeColor       =   &H000080FF&
      Height          =   255
      Left            =   5400
      TabIndex        =   20
      Top             =   720
      Width           =   855
   End
   Begin VB.Label Label2 
      BackColor       =   &H80000007&
      Caption         =   "Cuenta"
      ForeColor       =   &H000080FF&
      Height          =   255
      Left            =   120
      TabIndex        =   8
      Top             =   240
      Width           =   855
   End
   Begin VB.Label Label1 
      BackColor       =   &H8000000E&
      BorderStyle     =   1  'Fixed Single
      Caption         =   "Label1"
      Height          =   285
      Left            =   2160
      TabIndex        =   3
      Top             =   240
      Width           =   5415
   End
End
Attribute VB_Name = "IngMovBanco"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private TCHDep As Double, TotalDep As Double, TEfvoDep As Double, VEfvo As Double, Mov As String
Private LCHCartera As ListItem, LCHDepositar As ListItem
Private LMov As ListItem

Private Sub Cargar_Click()
On Error Resume Next
Set LMov = ListMov.ListItems.Add(, , Text1(3))
LMov.Tag = Text1(3)
LMov.SubItems(1) = Label9
LMov.SubItems(2) = Text1(4)
If Option2(0).Value = True Then
    LMov.SubItems(3) = "Ingreso"
Else
    LMov.SubItems(3) = "Egreso"
End If
TotalDep = TotalDep + Val(Text1(4))
Text1(1) = FormatNumber(TotalDep)
Label11 = FormatNumber(TotalDep)
Text1(3) = "": Label9.Caption = "": Text1(4) = "0.00"
Text1(3).SetFocus

End Sub

Private Sub ChCartera_DblClick()
On Error Resume Next

Set LCHCartera = CHCartera.ListItems.Item(CHCartera.SelectedItem.Index)
Set LCHDepositar = CHDepositar.ListItems.Add(, , LCHCartera.Tag)
LCHDepositar.Tag = LCHCartera.Tag
LCHDepositar.SubItems(1) = LCHCartera.SubItems(1)
LCHDepositar.SubItems(2) = LCHCartera.SubItems(2)
LCHDepositar.SubItems(3) = LCHCartera.SubItems(3)
LCHDepositar.SubItems(4) = LCHCartera.SubItems(4)
TCHDep = TCHDep + LCHCartera.SubItems(4)
TotalDep = TotalDep + LCHCartera.SubItems(4)
Label6 = FormatNumber(TCHDep)
Text1(1) = FormatNumber(TotalDep)
CHCartera.ListItems.Remove (CHCartera.SelectedItem.Index)
End Sub

Private Sub Command1_Click()
'On Error GoTo ErrorGrabar:
If Not Text1(1) = "0.00" Then
Set rsCtaCteBco = Nothing
Set rsDetMovBco = Nothing
Set rsasiento = Nothing
Set rsCtaCteBco = db.OpenRecordset("CtaCteBco")
Set rsDetMovBco = db.OpenRecordset("DetMovBco")
Set rsAsientos = db.OpenRecordset("Asientos")
If Mov = "Deposito" Then
    'graba movimiento en cta cte
    With rsCtaCteBco
        .AddNew
        .Fields("Fecha") = Fecha
        .Fields("CtaCte") = Text1(0)
        .Fields("NroMov") = Text1(6)
        .Fields("Debe") = Text1(1)
        .Fields("CodComp") = 2
        .Fields("Obs") = Text1(7)
        .Fields("Conciliado") = False
        .Update
    End With
    Set rsCtaCteBco = Nothing
    'graba detalle del comprobante
    With rsDetMovBco
        If Not Text1(2) = "" Or Not Text1(2) = "0.00" Then
            .AddNew
            .Fields("NroMov") = Text1(6)
            .Fields("TipoMov") = "Deposito"
            .Fields("CodMov") = 2
            .Fields("Efvo") = Text1(2)
            .Update
        End If
        If Not CHDepositar.ListItems.Count = 0 Then
            i = 0
            For i = i + 1 To CHDepositar.ListItems.Count
                Set LCHDepositar = CHDepositar.ListItems.Item(i)
                .AddNew
                .Fields("NroMov") = Text1(6)
                .Fields("TipoMov") = "Deposito"
                .Fields("CodMov") = 2
                .Fields("NroCH") = LCHDepositar.SubItems(2)
                .Fields("Bco") = LCHDepositar.Tag
                .Fields("FVto") = LCHDepositar.SubItems(3)
                .Fields("Importe") = LCHDepositar.SubItems(4)
                .Update
                'actualiza estado del cheque
                Set rsChTer = db.OpenRecordset("Select * From ChequesTerc Where CodBanco = " & LCHDepositar.Tag & " and NroCh = " & LCHDepositar.SubItems(2) & "")
                rsChTer.Edit
                rsChTer.LockEdits = True
                rsChTer.Fields("Estado") = "Depositado Cta" & Text1(0)
                rsChTer.Fields("Dado") = Text1(0)
                rsChTer.Fields("NroRec") = Text1(6)
                rsChTer.Fields("FEntregado") = Fecha
                rsChTer.Update
                rsChTer.LockEdits = False
            Next
        End If
    End With
    Set rsDetMovBco = Nothing
    'graba asiento correspondiente
    VFecha = Date
    VEjercicio = Mid(VFecha, 7, 4)
    VMes = Mid(VFecha, 4, 2)
    i = 0
    lPrimaryKeyAsiento = GetPrimaryKeyAsiento ' buscanroasiento
    
    With rsAsientos
        'graba importe del debe
        .AddNew
        .Fields("CtaCont") = Label15
        .Fields("Debe") = Text1(1)
        .Fields("CodComp") = 9
        .Fields("NroComp") = Text1(6)
        .Fields("Mes") = VMes
        .Fields("Ejercicio") = VEjercicio
        .Fields("NroAsiento") = lPrimaryKeyAsiento
        .Fields("Fecha") = Fecha
        .Update
        'graba haber
        If Not Text1(2) = "" Or Not Text1(2) = "0.00" Then
            .AddNew
            .Fields("CtaCont") = Label16
            .Fields("Haber") = Text1(2)
            .Fields("CodComp") = 9
            .Fields("NroComp") = Text1(6)
            .Fields("Mes") = VMes
            .Fields("Ejercicio") = VEjercicio
            .Fields("NroAsiento") = lPrimaryKeyAsiento
            .Fields("Fecha") = Fecha
            .Update
        End If
        If Not CHDepositar.ListItems.Count = 0 Then
            .AddNew
            .Fields("CtaCont") = Label17
            .Fields("Haber") = Label6
            .Fields("CodComp") = 9
            .Fields("NroComp") = Text1(6)
            .Fields("Mes") = VMes
            .Fields("Ejercicio") = VEjercicio
            .Fields("NroAsiento") = lPrimaryKeyAsiento
            .Fields("Fecha") = Fecha
            .Update
        End If
    End With
    Set rsAsientos = Nothing
End If
If Mov = "Retiro" Then
     With rsCtaCteBco
        .AddNew
        .Fields("Fecha") = Fecha
        .Fields("CtaCte") = Text1(0)
        .Fields("NroComp") = Text1(6)
        .Fields("NroMov") = Text1(6)
        .Fields("Haber") = Text1(5)
        .Fields("CodComp") = 3
        .Update
    End With
    Set rsCtaCteBco = Nothing
    'graba detalle del comprobante
    With rsDetMovBco
        .AddNew
        .Fields("NroMov") = Text1(6)
        .Fields("TipoMov") = "Extracción"
        .Fields("CodMov") = 3
        .Fields("Efvo") = Text1(5)
        .Update
    End With
    Set rsDetMovBco = Nothing
    'graba asiento correspondiente
    VFecha = Date
    VEjercicio = Mid(VFecha, 7, 4)
    VMes = Mid(VFecha, 4, 2)
    i = 0
    lPrimaryKeyAsiento = GetPrimaryKeyAsiento ' buscanroasiento
    
    With rsAsientos
        'graba importe del debe
        .AddNew
        .Fields("CtaCont") = Label15
        .Fields("Debe") = Text1(1)
        .Fields("CodComp") = 10
        .Fields("NroComp") = Text1(6)
        .Fields("Mes") = VMes
        .Fields("Ejercicio") = VEjercicio
        .Fields("NroAsiento") = lPrimaryKeyAsiento
        .Fields("Fecha") = Fecha
        .Update
        'graba haber
        .AddNew
        .Fields("Ctacont") = Label16
        .Fields("Haber") = Text1(5)
        .Fields("CodComp") = 9
        .Fields("NroComp") = Text1(6)
        .Fields("Mes") = VMes
        .Fields("ejercicio") = VEjercicio
        .Fields("NroAsiento") = lPrimaryKeyAsiento
        .Fields("Fecha") = Fecha
        .Update
    End With
End If
If Mov = "Mov" Then
    If Not ListMov.ListItems.Count = 0 Then
        VFecha = Date
        VEjercicio = Mid(VFecha, 7, 4)
        VMes = Mid(VFecha, 4, 2)
        i = 0
        For i = i + 1 To ListMov.ListItems.Count
            Set LMov = ListMov.ListItems.Item(i)
            With rsCtaCteBco
                .AddNew
                .Fields("Fecha") = Fecha
                .Fields("CtaCte") = Text1(0)
                .Fields("NroComp") = Text1(6)
                .Fields("NroMov") = Text1(6)
                If LMov.SubItems(3) = "Ingreso" Then
                    .Fields("Debe") = LMov.SubItems(2)
                Else
                    .Fields("Haber") = LMov.SubItems(2)
                End If
                .Fields("CodComp") = LMov.Tag
                .Update
            End With
            If LMov.SubItems(3) = "Ingreso" Then
                With rsAsientos
                    lPrimaryKeyAsiento = GetPrimaryKeyAsiento ' buscanroasiento
                    .AddNew
                    .Fields("Ctacont") = Label15
                    .Fields("Debe") = LMov.SubItems(2)
                    .Fields("CodComp") = 11
                    .Fields("NroComp") = Text1(6)
                    .Fields("Mes") = VMes
                    .Fields("Ejercicio") = VEjercicio
                    .Fields("NroAsiento") = lPrimaryKeyAsiento
                    .Fields("Fecha") = Fecha
                    .Update
                    
                    .AddNew
                    Set rsConsBco = db.OpenRecordset("Select * From ConceptoBco Where CodConcepto = " & LMov.Tag & "")
                    .Fields("Ctacont") = rsConsBco!CtaCont
                    Set rsConsBco = Nothing
                    .Fields("Haber") = LMov.SubItems(2)
                    .Fields("CodComp") = 11
                    .Fields("NroComp") = Text1(6)
                    .Fields("Mes") = VMes
                    .Fields("Ejercicio") = VEjercicio
                    .Fields("NroAsiento") = lPrimaryKeyAsiento
                    .Fields("Fecha") = Fecha
                    .Update
                End With
            Else
                With rsAsientos
                    lPrimaryKeyAsiento = GetPrimaryKeyAsiento ' buscanroasiento
                    .AddNew
                    .Fields("Ctacont") = Label15
                    .Fields("Haber") = LMov.SubItems(2)
                    .Fields("CodComp") = 11
                    .Fields("NroComp") = Text1(6)
                    .Fields("Mes") = VMes
                    .Fields("Ejercicio") = VEjercicio
                    .Fields("NroAsiento") = lPrimaryKeyAsiento
                    .Fields("Fecha") = Fecha
                    .Update
                    
                    .AddNew
                    Set rsConsBco = db.OpenRecordset("Select * From ConceptoBco Where CodConcepto = " & LMov.Tag & "")
                    .Fields("Ctacont") = rsConsBco!CtaCont
                    Set rsConsBco = Nothing
                    .Fields("Debe") = LMov.SubItems(2)
                    .Fields("CodComp") = 11
                    .Fields("NroComp") = Text1(6)
                    .Fields("Mes") = VMes
                    .Fields("Ejercicio") = VEjercicio
                    .Fields("NroAsiento") = lPrimaryKeyAsiento
                    .Fields("Fecha") = Fecha
                    .Update
                End With
            End If
        Next
        Set rsAsientos = Nothing
        Set rsCtaCteBco = Nothing
    End If
End If
MsgBox "Comprobante Grabado Correctamente", vbInformation
Form_Load
Else
    MsgBox "No hay Movimientos Cargados"
End If
End Sub

Private Sub Deposito_Click()
If Not Text1(0) = "" Then
    FDeposito.Top = 1680: FDeposito.Left = 120: FDeposito.Visible = True: FEfvo.Visible = False
    FMov.Visible = False
    Mov = "Deposito"
    Option1(0).Value = True
    Retiro.Enabled = False: Movimientos.Enabled = False
End If
End Sub

Private Sub Fecha_LostFocus()
If Text1(0) <> "" Then
If Not IsDate(Fecha) Or Fecha = "__/__/____" Then
    MsgBox "Fecha Invalida"
    Fecha.SetFocus
    Exit Sub
End If
End If
End Sub

Private Sub Form_Load()
i = 0
For i = i + 1 To Text1.Count
    If i = 2 Or i = 3 Or i = 5 Or i = 6 Then
        Text1(i - 1) = "0.00"
    Else
        Text1(i - 1) = ""
    End If
Next
Label1.Caption = ""
FDeposito.Visible = False: FCHCartera.Visible = False: FRetiro.Visible = False: FMov.Visible = False
ListMov.ListItems.Clear
CHCartera.ListItems.Clear
CHDepositar.ListItems.Clear
Deposito.Enabled = True: Retiro.Enabled = True: Movimientos.Enabled = True
TCHDep = 0: TotalDep = 0: TEfvoDep = 0: VEfvo = 0
Mov = ""
Fecha.Mask = ""
Fecha.Text = ""
Fecha.Mask = "##/##/####"
Text1(5) = "0.00"
Label11.Caption = "0.00"
Label6.Caption = "0.00"
End Sub
Private Function GetPrimaryKeyAsiento()
        ' Devuelve una clave única basada en el número de cliente
'Set rsAsiento = db.OpenRecordset("Asiento", 2, 0)
    With rsAsientos
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetPrimaryKeyAsiento = .Fields("NroAsiento") + 1
        
        Else
            
            GetPrimaryKeyAsiento = 1
        
        End If
        
    End With
End Function

Private Sub ListMov_DblClick()
Set LMov = ListMov.ListItems.Item(ListMov.SelectedItem.Index)
Text1(3) = LMov.Tag
Label9 = LMov.SubItems(1)
Text1(4) = LMov.SubItems(2)
If LMov.SubItems(3) = "Ingreso" Then
    Option2(0).Value = True
Else
    Option2(1).Value = True
End If
TotalDep = TotalDep - Val(Text1(4))
Text1(1) = FormatNumber(TotalDep)
Label11 = FormatNumber(TotalDep)
ListMov.ListItems.Remove (ListMov.SelectedItem.Index)
Text1(3).SetFocus
End Sub

Private Sub Movimientos_Click()
If Not Text1(0) = "" Then
    FMov.Top = 1680: FMov.Left = 120: FMov.Visible = True
    Mov = "Mov"
    Option2(0).Value = True
    Text1(3).SetFocus
    Deposito.Enabled = False: Retiro.Enabled = False
End If

End Sub

Private Sub Option1_Click(Index As Integer)
If Index = 0 Then
    FCHCartera.Visible = False
    FEfvo.Visible = True
Else
    Dim Lista As ListItem
    FCHCartera.Visible = True
    FEfvo.Visible = False
    Set rsChTer = db.OpenRecordset("Select * From ChequesTerc Where Estado = 'En Cartera' Order By FechaVto")
    CHCartera.ListItems.Clear
    Do While Not rsChTer.EOF
        Set Lista = CHCartera.ListItems.Add(, , rsChTer!CodBanco)
        Lista.Tag = rsChTer!CodBanco
        Set rsBancos = db.OpenRecordset("Select * From Bancos Where CodBco = " & rsChTer!CodBanco & "")
        Lista.SubItems(1) = rsBancos!DescBco
        Set rsBancos = Nothing
        Lista.SubItems(2) = rsChTer!NroCH
        Lista.SubItems(3) = rsChTer!FechaVto
        Lista.SubItems(4) = FormatNumber(rsChTer!Importe)
        rsChTer.MoveNext
    Loop
    Set rsChTer = Nothing
End If
End Sub

Private Sub Option2_Click(Index As Integer)
Select Case Index
    Case 0: Option2(0).Value = True: Option2(1).Value = False
    Case 1: Option2(0).Value = False: Option2(1).Value = True
End Select
End Sub

Private Sub Retiro_Click()
If Not Text1(0) = "" Then
    FRetiro.Top = 1680: FRetiro.Left = 120: FRetiro.Visible = True
    FMov.Visible = False: FDeposito.Visible = False
    Mov = "Retiro"
    Deposito.Enabled = False: Movimientos.Enabled = False
End If
End Sub

Private Sub Text1_GotFocus(Index As Integer)
Select Case Index
    Case 4:
        i = Len(Text1(4))
        Text1(4).SelStart = 0
        Text1(4).SelLength = i
        Text1(4).SetFocus
    Case 5:
        i = Len(Text1(5))
        Text1(5).SelStart = 0
        Text1(5).SelLength = i
        Text1(5).SetFocus
End Select
End Sub

Private Sub Text1_LostFocus(Index As Integer)
Select Case Index
Case 0:
    If Not Text1(0) = "" Then
    Set rsCtaCtePropias = db.OpenRecordset("Select * From CtaCtePropias Where CtaCte = '" & Text1(0) & "'")
    If Not rsCtaCtePropias.EOF And Not rsCtaCtePropias.BOF Then
        Label1.Caption = rsCtaCtePropias!DescBco
        Label15.Caption = rsCtaCtePropias!CtaContable
    Else
        MsgBox "La Cuenta no exsiste"
        Text1(0) = ""
        Text1(0).SetFocus
        Exit Sub
    End If
    End If
Case 2:
    TEfvoDep = TEfvoDep + Text1(2) - VEfvo
    TotalDep = TotalDep + TEfvoDep - VEfvo
    VEfvo = Text1(2)
    Text1(1) = FormatNumber(TotalDep)
    Text1(2) = FormatNumber(TEfvoDep)
Case 3:
    If Not Text1(3) = "" Then
        Set rsConsBco = db.OpenRecordset("Select * From ConceptoBco Where CodConcepto = " & Text1(3) & "")
        If Not rsConsBco.EOF And Not rsConsBco.BOF Then
            Label9 = rsConsBco!descconcepto
        Else
            MsgBox "El concepto no Exixte"
            Text1(3).SetFocus
            Exit Sub
        End If
        Set rsConsBco = Nothing
    End If
Case 5:
    TEfvoDep = TEfvoDep + Text1(5) - VEfvo
    TotalDep = TotalDep + TEfvoDep - VEfvo
    VEfvo = Text1(5)
    Text1(1) = FormatNumber(TotalDep)
    Text1(5) = FormatNumber(TEfvoDep)
Case 6:
    If Not Fecha.Text = "__/__/____" Then
    If Text1(6) = "" Then
        MsgBox "Campo Obligatorio", vbInformation
        
        Text1(6).SetFocus
        Exit Sub
    End If
    End If
End Select
End Sub
