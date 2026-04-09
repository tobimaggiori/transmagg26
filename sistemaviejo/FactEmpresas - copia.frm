VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Begin VB.Form FactEmpresas 
   BackColor       =   &H8000000A&
   Caption         =   "Ingreso de Facturacion"
   ClientHeight    =   8460
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   9645
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   8460
   ScaleWidth      =   9645
   Begin VB.Frame Facturar 
      Height          =   8415
      Left            =   0
      TabIndex        =   14
      Top             =   0
      Width           =   9615
      Begin VB.CheckBox CalcIVA 
         Caption         =   "Calcula IVA"
         Height          =   255
         Left            =   5760
         TabIndex        =   43
         Top             =   1440
         Width           =   1695
      End
      Begin VB.ComboBox Comp 
         Height          =   315
         Left            =   1560
         TabIndex        =   0
         Top             =   360
         Width           =   2295
      End
      Begin VB.Frame DetalleFact 
         Caption         =   "Detalle Factura"
         ForeColor       =   &H00FF0000&
         Height          =   6495
         Left            =   120
         TabIndex        =   20
         Top             =   1800
         Width           =   9375
         Begin VB.TextBox Text3 
            Appearance      =   0  'Flat
            Height          =   285
            Index           =   5
            Left            =   1080
            TabIndex        =   7
            Text            =   "Text3"
            Top             =   600
            Width           =   975
         End
         Begin VB.TextBox Text3 
            Appearance      =   0  'Flat
            Height          =   285
            Index           =   6
            Left            =   2040
            TabIndex        =   8
            Text            =   "Text3"
            Top             =   600
            Width           =   1335
         End
         Begin VB.TextBox Text3 
            Appearance      =   0  'Flat
            Height          =   285
            Index           =   7
            Left            =   3360
            TabIndex        =   9
            Text            =   "Text3"
            Top             =   600
            Width           =   1215
         End
         Begin VB.TextBox Text3 
            Appearance      =   0  'Flat
            Height          =   285
            Index           =   8
            Left            =   4560
            TabIndex        =   10
            Text            =   "Text3"
            Top             =   600
            Width           =   1215
         End
         Begin VB.TextBox Text3 
            Appearance      =   0  'Flat
            Height          =   285
            Index           =   9
            Left            =   5760
            TabIndex        =   11
            Text            =   "Text3"
            Top             =   600
            Width           =   975
         End
         Begin VB.TextBox Text3 
            Appearance      =   0  'Flat
            Height          =   285
            Index           =   10
            Left            =   6720
            TabIndex        =   12
            Text            =   "Text3"
            Top             =   600
            Width           =   975
         End
         Begin VB.TextBox Text3 
            Appearance      =   0  'Flat
            Height          =   285
            Index           =   11
            Left            =   7680
            TabIndex        =   13
            Text            =   "Text3"
            Top             =   600
            Width           =   975
         End
         Begin VB.TextBox Text4 
            Appearance      =   0  'Flat
            Height          =   285
            Index           =   0
            Left            =   7800
            TabIndex        =   24
            Text            =   "Text4"
            Top             =   5280
            Width           =   1095
         End
         Begin VB.TextBox Text4 
            Appearance      =   0  'Flat
            Height          =   285
            Index           =   1
            Left            =   7800
            TabIndex        =   23
            Text            =   "Text4"
            Top             =   5640
            Width           =   1095
         End
         Begin VB.TextBox Text4 
            Appearance      =   0  'Flat
            Height          =   285
            Index           =   2
            Left            =   7800
            TabIndex        =   22
            Text            =   "Text4"
            Top             =   6000
            Width           =   1095
         End
         Begin VB.CommandButton GrabarFact 
            Caption         =   "Grabar Factura"
            Height          =   495
            Left            =   1440
            TabIndex        =   21
            Top             =   5400
            Width           =   3615
         End
         Begin MSComctlLib.ListView LDetFact 
            Height          =   4215
            Left            =   120
            TabIndex        =   25
            Top             =   960
            Width           =   9135
            _ExtentX        =   16113
            _ExtentY        =   7435
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
               Object.Width           =   1720
            EndProperty
            BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   1
               Text            =   "Remito"
               Object.Width           =   1720
            EndProperty
            BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   2
               Text            =   "Mercaderia"
               Object.Width           =   2355
            EndProperty
            BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   3
               Text            =   "Procedencia"
               Object.Width           =   2355
            EndProperty
            BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   4
               Text            =   "Destino"
               Object.Width           =   2355
            EndProperty
            BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   5
               Text            =   "Kilos"
               Object.Width           =   1720
            EndProperty
            BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   6
               Text            =   "Tarifa"
               Object.Width           =   1720
            EndProperty
            BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   7
               Text            =   "STotal"
               Object.Width           =   1720
            EndProperty
         End
         Begin MSMask.MaskEdBox FViaje 
            Height          =   285
            Left            =   120
            TabIndex        =   6
            Top             =   600
            Width           =   975
            _ExtentX        =   1720
            _ExtentY        =   503
            _Version        =   393216
            Appearance      =   0
            PromptChar      =   "_"
         End
         Begin VB.Label Label23 
            Caption         =   "Fecha"
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
            Left            =   240
            TabIndex        =   36
            Top             =   360
            Width           =   615
         End
         Begin VB.Label Label24 
            Alignment       =   2  'Center
            Caption         =   "Remito"
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
            Left            =   1200
            TabIndex        =   35
            Top             =   360
            Width           =   855
         End
         Begin VB.Label Label25 
            Alignment       =   2  'Center
            Caption         =   "Mercaderia"
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
            Left            =   2040
            TabIndex        =   34
            Top             =   360
            Width           =   1335
         End
         Begin VB.Label Label26 
            Alignment       =   2  'Center
            Caption         =   "Procedencia"
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
            Left            =   3360
            TabIndex        =   33
            Top             =   360
            Width           =   1215
         End
         Begin VB.Label Label27 
            Alignment       =   2  'Center
            Caption         =   "Destino"
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
            Left            =   4560
            TabIndex        =   32
            Top             =   360
            Width           =   1215
         End
         Begin VB.Label Label28 
            Alignment       =   2  'Center
            Caption         =   "Kilos"
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
            Left            =   5760
            TabIndex        =   31
            Top             =   360
            Width           =   975
         End
         Begin VB.Label Label29 
            Alignment       =   2  'Center
            Caption         =   "Tarifa"
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
            Left            =   6720
            TabIndex        =   30
            Top             =   360
            Width           =   975
         End
         Begin VB.Label Label30 
            Alignment       =   2  'Center
            Caption         =   "SubTotal"
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
            Left            =   7680
            TabIndex        =   29
            Top             =   360
            Width           =   975
         End
         Begin VB.Label Label31 
            Caption         =   "Sub Total"
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
            Left            =   6240
            TabIndex        =   28
            Top             =   5280
            Width           =   1455
         End
         Begin VB.Label Label32 
            Caption         =   "IVA"
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
            Left            =   6240
            TabIndex        =   27
            Top             =   5640
            Width           =   1455
         End
         Begin VB.Label Label33 
            Caption         =   "Localidad"
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
            Left            =   6240
            TabIndex        =   26
            Top             =   6000
            Width           =   1455
         End
      End
      Begin VB.Frame BuscaEmpresas 
         Caption         =   "BuscarEmpresas"
         Height          =   2895
         Left            =   1560
         TabIndex        =   16
         Top             =   3120
         Visible         =   0   'False
         Width           =   5895
         Begin VB.TextBox Text5 
            Height          =   285
            Left            =   1080
            TabIndex        =   17
            Text            =   "Text5"
            Top             =   2280
            Width           =   4575
         End
         Begin MSComctlLib.ListView ListEmpresas 
            Height          =   1815
            Left            =   240
            TabIndex        =   18
            Top             =   360
            Width           =   5500
            _ExtentX        =   9710
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
            NumItems        =   2
            BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               Text            =   "CodEmpresas"
               Object.Width           =   2540
            EndProperty
            BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   1
               Text            =   "Descripcion"
               Object.Width           =   7056
            EndProperty
         End
         Begin VB.Label Label34 
            Alignment       =   2  'Center
            Caption         =   "Buscar"
            BeginProperty Font 
               Name            =   "MS Sans Serif"
               Size            =   8.25
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            ForeColor       =   &H0080C0FF&
            Height          =   255
            Left            =   240
            TabIndex        =   19
            Top             =   2280
            Width           =   855
         End
      End
      Begin VB.TextBox Text3 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   0
         Left            =   1080
         TabIndex        =   1
         Text            =   "Text3"
         Top             =   720
         Width           =   615
      End
      Begin VB.TextBox Text3 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   1
         Left            =   1800
         TabIndex        =   15
         Text            =   "Text3"
         Top             =   720
         Width           =   2055
      End
      Begin VB.TextBox Text3 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   2
         Left            =   1080
         TabIndex        =   3
         Text            =   "Text3"
         Top             =   1080
         Width           =   4575
      End
      Begin VB.TextBox Text3 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   3
         Left            =   1080
         TabIndex        =   4
         Text            =   "Text3"
         Top             =   1440
         Width           =   1935
      End
      Begin VB.TextBox Text3 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   4
         Left            =   3720
         TabIndex        =   5
         Text            =   "Text3"
         Top             =   1440
         Width           =   1935
      End
      Begin MSMask.MaskEdBox FFact 
         Height          =   285
         Left            =   4560
         TabIndex        =   2
         Top             =   720
         Width           =   1095
         _ExtentX        =   1931
         _ExtentY        =   503
         _Version        =   393216
         Appearance      =   0
         PromptChar      =   "_"
      End
      Begin VB.Label Label1 
         Caption         =   "Comprobante"
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
         TabIndex        =   42
         Top             =   360
         Width           =   1455
      End
      Begin VB.Label Label10 
         Caption         =   "Empresa"
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
         TabIndex        =   41
         Top             =   720
         Width           =   1455
      End
      Begin VB.Label Label12 
         Caption         =   "Fecha"
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
         Left            =   3960
         TabIndex        =   40
         Top             =   720
         Width           =   1455
      End
      Begin VB.Label Label13 
         Caption         =   "Dirección"
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
         TabIndex        =   39
         Top             =   1080
         Width           =   1455
      End
      Begin VB.Label Label15 
         Caption         =   "Localidad"
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
         TabIndex        =   38
         Top             =   1440
         Width           =   1455
      End
      Begin VB.Label Label22 
         Caption         =   "CUIT"
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
         Left            =   3120
         TabIndex        =   37
         Top             =   1440
         Width           =   1455
      End
   End
End
Attribute VB_Name = "FactEmpresas"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Comp_LostFocus()
If Comp.ListIndex = 2 Then
    FViaje.BackColor = &H80FFFF
    Text3(5).Enabled = False
    Text3(5) = "-"
    Text3(6).BackColor = &H80FFFF
    Text3(7).Enabled = False
    Text3(7) = "-"
    Text3(8).Enabled = False
    Text3(8) = "-"
    Text3(9).Enabled = False
    Text3(9) = "1000"
    Text3(10).BackColor = &H80FFFF
Else
    Text3(5).Enabled = True
    Text3(7).Enabled = True
    Text3(8).Enabled = True
    Text3(9).Enabled = True
    Text3(6).BackColor = &H80000005
    Text3(10).BackColor = &H80000005
    FViaje.BackColor = &H80000005
    Text3(5) = ""
    Text3(7) = ""
    Text3(8) = ""
    Text3(9) = "0"
End If
End Sub

Private Sub Form_Load()
LDetFact.ListItems.Clear
TNetoFact = 0: TIVAFact = 0: TFact = 0
Items = 0
For Items = Items + 1 To Text3.Count
    If Items = 10 Or Items = 11 Or Items = 12 Then
        Text3(9) = "0.00": Text3(10) = "0.00": Text3(11) = "0.00"
    Else
        Text3(Items - 1) = ""
    End If
Next
Items = 0
For Items = Items + 1 To Text4.Count
    Text4(Items - 1) = "0.00"
Next
FViaje.Mask = ""
FViaje.Text = ""
FViaje.Mask = "##/##/####"
FFact.Mask = ""
FFact.Text = ""
FFact.Mask = "##/##/####"
Comp.AddItem ("Factura")
Comp.AddItem ("Nota de Credito")
Comp.AddItem ("Nota de Debito")
Comp.ListIndex = 0
CalcIVA.Value = 1
End Sub

Private Sub GrabarFact_Click()
Dim VNroFact As Long
If TFact = 0 Then
    MsgBox "Debe cagar los viajes", vbInformation
    Exit Sub
End If
If Text3(0) = "" Then
    MsgBox "Debe Seleccionar una Empresa", vbInformation
    Text3(0).SetFocus: Exit Sub
End If
Set rsEncabFact = db.OpenRecordset("Select * From EncabFact Order By NroFact")
rsEncabFact.MoveLast
VNroFact = rsEncabFact!NroFact + 1
With rsEncabFact
    .AddNew
    .Fields("NroFact") = VNroFact
    .Fields("Fecha") = FFact
    .Fields("Codigo") = Text3(0)
    .Fields("TipoFact") = Comp.ListIndex + 1
    .Fields("TNeto") = FormatNumber(TNetoFact)
    .Fields("TIVA") = FormatNumber(TIVAFact)
    .Fields("TGral") = FormatNumber(TFact)
    .Update
End With
Set rsEncabFact = Nothing
Set rsDetFact = db.OpenRecordset("DetFact")
Items = 0
For Items = Items + 1 To LDetFact.ListItems.Count
    Set Lista = LDetFact.ListItems.Item(Items)
    With rsDetFact
        .AddNew
        .Fields("NroFact") = VNroFact
        .Fields("FechaViaje") = Lista.Tag
        .Fields("NroRem") = Lista.SubItems(1)
        .Fields("Mercaderia") = Lista.SubItems(2)
        .Fields("Procedencia") = Lista.SubItems(3)
        .Fields("Destino") = Lista.SubItems(4)
        .Fields("Kilos") = Lista.SubItems(5)
        .Fields("Tarifa") = Lista.SubItems(6)
        .Fields("STotal") = Lista.SubItems(7)
        .Update
    End With
Next
Set rsDetFact = Nothing
Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
With rsCtaCteEmp
    .AddNew
    .Fields("Fecha") = FFact
    .Fields("CodEmp") = Text3(0)
    .Fields("PtoVta") = 1
    .Fields("TipoComp") = Comp.ListIndex + 1
    .Fields("NroComp") = VNroFact
    If Comp.ListIndex = 1 Then
        .Fields("Haber") = FormatNumber(TFact)
    Else
        .Fields("Debe") = FormatNumber(TFact)
    End If
    .Fields("SaldoComp") = FormatNumber(TFact)
    .Update
End With
Set rsCtaCteEmp = Nothing

resp = MsgBox("Grabado Correctamente con el nro:" & VNroFact & vbCrLf & "Imprimir ?", vbQuestion + vbYesNo + vbDefaultButton2)
If resp = 6 Then
    Call Imprime_Fact(VNroFact, Comp.ListIndex + 1)
End If
Call Form_Load
End Sub

Private Sub LDetFact_DblClick()
Set Lista = LDetFact.ListItems.Item(LDetFact.SelectedItem.Index)
FViaje = Lista.Tag
Text3(5) = Lista.SubItems(1)
Text3(6) = Lista.SubItems(2)
Text3(7) = Lista.SubItems(3)
Text3(8) = Lista.SubItems(4)
Text3(9) = Lista.SubItems(5)
Text3(10) = Lista.SubItems(6)
Text3(11) = Lista.SubItems(7)
TNetoFact = TNetoFact - Text3(11)
TIVAFact = TNetoFact * 21 / 100
TFact = TNetoFact + TIVAFact
Text4(0) = FormatNumber(TNetoFact)
Text4(1) = FormatNumber(TIVAFact)
Text4(2) = FormatNumber(TFact)
LDetFact.ListItems.Remove (LDetFact.SelectedItem.Index)
End Sub

Private Sub Text3_Change(Index As Integer)
Select Case Index
Case 9:
    If IsNumeric(Text3(9)) = False Then
            MsgBox "El campo debe ser numerico"
            Text3(9).SetFocus
        Else
            Text3(11) = FormatNumber((Val(Text3(9)) * Val(Text3(10))) / 1000)
        End If
 Case 10:
        If IsNumeric(Text3(10)) = False Then
            MsgBox "El campo debe ser numerico"
            Text3(10).SetFocus
        Else
            Text3(11) = FormatNumber((Val(Text3(9)) * Val(Text3(10))) / 1000)
        End If
End Select

End Sub

Private Sub Text3_GotFocus(Index As Integer)
Select Case Index
    Case 9:
        X = Len(Text3(9))
        Text3(9).SelStart = 0
        Text3(9).SelLength = X
    Case 10:
        X = Len(Text3(10))
        Text3(10).SelStart = 0
        Text3(10).SelLength = X
End Select
End Sub

Private Sub Text3_LostFocus(Index As Integer)
Select Case Index
    Case 0:
        If Not Text3(0) = "" Then
            Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas Where CodEmpresas = " & Text3(0) & "")
            If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
                Text3(1) = rsEmpresas.Fields("DescEmpresas")
                Text3(2) = rsEmpresas.Fields("Direccion")
                Text3(3) = rsEmpresas.Fields("Localidad")
                Text3(4) = rsEmpresas.Fields("CUIT")
                FFact.SetFocus
            Else
                MsgBox "La empresa no existe", vbInformation
            End If
        Else
            Viene = "Factura"
            With BuscEmpresas
                .Show
                .Height = 3435
                .Width = 6030
                .Top = (Screen.Height - .Height) / 2
                .Left = (Screen.Width - .Width) / 2
            End With
        End If
    Case 9:
        If IsNumeric(Text3(9)) = False Then
            MsgBox "El campo debe ser numerico"
            Text3(9).SetFocus
        End If
    Case 11:
        If Not Text3(5) = "" And Not Text3(6) = "" And Not Text3(7) = "" And Not Text3(8) = "" And Not Text3(9) = "" And Not Text3(10) = "" Then
            Set Lista = LDetFact.ListItems.Add(, , FViaje)
            Lista.Tag = FViaje
            Lista.SubItems(1) = Text3(5)
            Lista.SubItems(2) = Text3(6)
            Lista.SubItems(3) = Text3(7)
            Lista.SubItems(4) = Text3(8)
            Lista.SubItems(5) = Text3(9)
            Lista.SubItems(6) = Text3(10)
            Lista.SubItems(7) = Text3(11)
            TNetoFact = TNetoFact + Text3(11)
            If CalcIVA.Value = 1 Then
                TIVAFact = TIVAFact + Text3(11) * 21 / 100
            End If
            TFact = TNetoFact + TIVAFact
            Text4(0) = FormatNumber(TNetoFact)
            Text4(1) = FormatNumber(TIVAFact)
            Text4(2) = FormatNumber(TFact)
            If Not Comp.ListIndex = 2 Then
                FViaje.Mask = "": FViaje.Text = "": FViaje.Mask = "##/##/####"
                Text3(5) = "": Text3(7) = "": Text3(8) = "": Text3(11) = "0.00"
                Text3(9) = "0.00"
            End If
            Text3(6) = ""
            Text3(10) = "0.00"
            FViaje.SetFocus
        Else
            MsgBox "Faltan datos obligatorios del viaje", vbInformation
        End If
End Select

End Sub
