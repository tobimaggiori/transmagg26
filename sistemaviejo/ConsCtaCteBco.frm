VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Begin VB.Form ConsCtaCteBco 
   BackColor       =   &H00000000&
   Caption         =   "Consulta Cta Cte Banco"
   ClientHeight    =   5640
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   13815
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   5640
   ScaleWidth      =   13815
   Begin VB.TextBox Text1 
      Height          =   285
      Left            =   1680
      TabIndex        =   0
      Text            =   "Text1"
      Top             =   240
      Width           =   855
   End
   Begin MSComctlLib.ListView CtaCte 
      Height          =   4095
      Left            =   240
      TabIndex        =   4
      Top             =   1080
      Width           =   13405
      _ExtentX        =   23654
      _ExtentY        =   7223
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
   Begin MSMask.MaskEdBox FHasta 
      Height          =   285
      Left            =   6600
      TabIndex        =   2
      Top             =   600
      Width           =   1455
      _ExtentX        =   2566
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin MSMask.MaskEdBox FDesde 
      Height          =   285
      Left            =   1680
      TabIndex        =   1
      Top             =   600
      Width           =   1455
      _ExtentX        =   2566
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin KewlButtonz.KewlButtons Buscar 
      Height          =   495
      Left            =   8280
      TabIndex        =   3
      Top             =   360
      Width           =   2415
      _ExtentX        =   4260
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Consultar Cta Cte"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   14737632
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "ConsCtaCteBco.frx":0000
      PICN            =   "ConsCtaCteBco.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Label Label4 
      BackColor       =   &H00000000&
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
      ForeColor       =   &H0080C0FF&
      Height          =   375
      Left            =   5400
      TabIndex        =   8
      Top             =   600
      Width           =   1095
   End
   Begin VB.Label Label3 
      BackColor       =   &H00000000&
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
      ForeColor       =   &H0080C0FF&
      Height          =   375
      Left            =   360
      TabIndex        =   7
      Top             =   600
      Width           =   1095
   End
   Begin VB.Label Label2 
      BackColor       =   &H80000005&
      BorderStyle     =   1  'Fixed Single
      Caption         =   "Label2"
      Height          =   285
      Left            =   2640
      TabIndex        =   6
      Top             =   240
      Width           =   5415
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Empresa:"
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
      Height          =   375
      Left            =   360
      TabIndex        =   5
      Top             =   240
      Width           =   1095
   End
End
Attribute VB_Name = "ConsCtaCteBco"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub Buscar_Click()
Dim VSaldo As Double
Dim VsaldoInicial As Double
Dim VFDesde As Date
On Error Resume Next
If FDesde.Text = "__/__/____" Or FHasta = "__/__/____" Then
    MsgBox "Debe ingresar fecha de consulta"
    Exit Sub
End If
If Text1 = "" Then
    MsgBox "Debe Ingresar un Fletero", vbInformation
    Exit Sub
End If
'If Format(FDesde, "mm/dd/yyyy") > Format(FHasta, "mm/dd/yyyy") Then
 '   MsgBox "Fecha Desde No puede ser mayor que Fecha Hasta", vbInformation
 '   Exit Sub
'End If
VFDesde = FDesde
VSaldo = 0
VsaldoInicial = 0
'CALCULA SALDO INICIAL
CtaCte.ListItems.Clear
Set rsCtaCteBco = db.OpenRecordset("SELECT * FROM CtaCteBco WHERE Fecha < #" & Format(FDesde, "mm/dd/yyyy") & "# AND CtaCte = '" & Text1 & "'")
Do While Not rsCtaCteBco.EOF
    If Not rsCtaCteBco!Debe = "" Then
        VFDesde = rsCtaCteBco!Fecha
        VsaldoInicial = VsaldoInicial + rsCtaCteBco!Debe
    End If
    If Not rsCtaCteBco!Haber = "" Then
        VsaldoInicial = VsaldoInicial - rsCtaCteBco!Haber
    End If
    rsCtaCteBco.MoveNext
Loop
Set Lista = CtaCte.ListItems.Add(, , "")
Lista.SubItems(2) = "Saldo Inicial"
Lista.SubItems(5) = FormatNumber(VsaldoInicial)
Set rsCtaCteProv = Nothing
'BUSCA DETALLE DEL MAYOR
Set rsCtaCteBco = db.OpenRecordset("SELECT * FROM CtaCtebco WHERE CtaCte = '" & Text1 & "' AND Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " # ORDER BY Fecha")
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
    End If
    If Not rsCtaCteBco!Haber = "" Then
        Lista.SubItems(4) = FormatNumber(rsCtaCteBco!Haber)
        VSaldo = VSaldo - rsCtaCteBco!Haber
    End If
    Lista.SubItems(5) = FormatNumber(VSaldo)
    Lista.SubItems(6) = rsCtaCteBco!Obs
  ' Lista.SubItems(7) = FormatNumber(rsCtaCteBco!SaldoComp)
    rsCtaCteBco.MoveNext
Loop

End Sub

Private Sub Form_KeyDown(KeyCode As Integer, Shift As Integer)
Select Case KeyCode
Case vbKeyF3: Call Busc
End Select

End Sub
Private Sub Busc()
With BuscEmpresas
        .Show
        .Height = 6015
        .Width = 6225
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2
        .Viene = "CtaCte"
    End With
End Sub
Private Sub Form_Load()
Text1 = "": Label2 = ""
FDesde.Mask = ""
FDesde.Text = ""
FDesde.Mask = "##/##/####"
FHasta.Mask = ""
FHasta.Text = ""
FHasta.Mask = "##/##/####"

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


