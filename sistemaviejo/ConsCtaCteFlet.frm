VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Begin VB.Form ConsCtaCteFlet 
   BackColor       =   &H80000007&
   Caption         =   "Consulta de Cuenta Corriente de Fleteros"
   ClientHeight    =   5415
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   11340
   KeyPreview      =   -1  'True
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   5415
   ScaleWidth      =   11340
   Begin VB.CommandButton Command1 
      Caption         =   "DEJA EN CERO"
      Height          =   255
      Left            =   3600
      TabIndex        =   10
      Top             =   720
      Width           =   1335
   End
   Begin MSComctlLib.ListView CtaCte 
      Height          =   4095
      Left            =   120
      TabIndex        =   7
      Top             =   1080
      Width           =   10905
      _ExtentX        =   19235
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
         Object.Width           =   353
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
   Begin MSMask.MaskEdBox FHasta 
      Height          =   285
      Left            =   6480
      TabIndex        =   4
      Top             =   600
      Width           =   1455
      _ExtentX        =   2566
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin MSMask.MaskEdBox FDesde 
      Height          =   285
      Left            =   1560
      TabIndex        =   3
      Top             =   600
      Width           =   1455
      _ExtentX        =   2566
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Left            =   1560
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   240
      Width           =   855
   End
   Begin KewlButtonz.KewlButtons Buscar 
      Height          =   735
      Left            =   8160
      TabIndex        =   8
      Top             =   240
      Width           =   1455
      _ExtentX        =   2566
      _ExtentY        =   1296
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
      MICON           =   "ConsCtaCteFlet.frx":0000
      PICN            =   "ConsCtaCteFlet.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons KewlButtons1 
      Height          =   735
      Left            =   9840
      TabIndex        =   9
      Top             =   240
      Width           =   1215
      _ExtentX        =   2143
      _ExtentY        =   1296
      BTYPE           =   1
      TX              =   "Imprimr"
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
      MICON           =   "ConsCtaCteFlet.frx":1D26
      PICN            =   "ConsCtaCteFlet.frx":1D42
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
      Left            =   5280
      TabIndex        =   6
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
      Left            =   240
      TabIndex        =   5
      Top             =   600
      Width           =   1095
   End
   Begin VB.Label Label2 
      BackColor       =   &H80000005&
      BorderStyle     =   1  'Fixed Single
      Caption         =   "Label2"
      Height          =   285
      Left            =   2520
      TabIndex        =   2
      Top             =   240
      Width           =   5415
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Fletero:"
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
      Left            =   240
      TabIndex        =   0
      Top             =   240
      Width           =   1095
   End
End
Attribute VB_Name = "ConsCtaCteFlet"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Buscar_Click()
Dim VSaldo As Double
Dim VsaldoInicial As Double
Dim VFDesde As Date
If FDESDE.Text = "__/__/____" Or FHASTA = "__/__/____" Then
    MsgBox "Debe ingresar fecha de consulta"
    Exit Sub
End If
If Text1 = "" Then
    MsgBox "Debe Ingresar una Empresa", vbInformation
    Exit Sub
End If
If Format(FDESDE, "mm/dd/yyyy") > Format(FHASTA, "mm/dd/yyyy") Then
    MsgBox "Fecha Desde No puede ser mayor que Fecha Hasta", vbInformation
    Exit Sub
End If
VFDesde = FDESDE
VSaldo = 0
VsaldoInicial = 0
'CALCULA SALDO INICIAL
CtaCte.ListItems.Clear
Set rsCtaCteProv = db.OpenRecordset("SELECT * FROM CtaCteProv WHERE Fecha < #" & Format(FDESDE, "mm/dd/yyyy") & "# AND CodProv = " & Text1 & "")
Do While Not rsCtaCteProv.EOF
    If Not rsCtaCteProv!Debe = "" Then
        VFDesde = rsCtaCteProv!Fecha
        VsaldoInicial = VsaldoInicial - rsCtaCteProv!Debe
    End If
    If Not rsCtaCteProv!Haber = "" Then
        VsaldoInicial = VsaldoInicial + rsCtaCteProv!Haber
    End If
    rsCtaCteProv.MoveNext
Loop
Set Lista = CtaCte.ListItems.Add(, , "")
Lista.SubItems(2) = "Saldo Inicial"
Lista.SubItems(6) = FormatNumber(VsaldoInicial)
Set rsCtaCteProv = Nothing
'BUSCA DETALLE DEL MAYOR
Set rsCtaCteProv = db.OpenRecordset("SELECT * FROM CtaCteProv WHERE CodProv = " & Text1 & " AND Fecha BETWEEN # " + Format(FDESDE, "mm/dd/yyyy") + " # AND # " + Format(FHASTA, "mm/dd/yyyy") + " # ORDER BY Fecha")
VSaldo = VsaldoInicial
Do While Not rsCtaCteProv.EOF
    Set Lista = CtaCte.ListItems.Add(, , rsCtaCteProv!Fecha)
    Lista.Tag = rsCtaCteProv!Fecha
    Lista.SubItems(1) = rsCtaCteProv!TipoComp
    Set rsComprobantes = db.OpenRecordset("SELECT * FROM Comprobantes WHERE CodComp = " & rsCtaCteProv!TipoComp & "")
    Lista.SubItems(2) = rsComprobantes!DescComp
    Set rsComprobantes = Nothing
    VTamaño = Len(rsCtaCteProv!PtoVta)
    Select Case VTamaño
        Case 1: VPtoVta = "000" & rsCtaCteProv!PtoVta
        Case 2: VPtoVta = "00" & rsCtaCteProv!PtoVta
        Case 3: VPtoVta = "0" & rsCtaCteProv!PtoVta
        Case 4: VPtoVta = rsCtaCteProv!PtoVta
    End Select
    VTamaño = Len(rsCtaCteProv!NroComp)
    Select Case VTamaño
        Case 1: VNroFact = "0000000" & rsCtaCteProv!NroComp
        Case 2: VNroFact = "000000" & rsCtaCteProv!NroComp
        Case 3: VNroFact = "00000" & rsCtaCteProv!NroComp
        Case 4: VNroFact = "0000" & rsCtaCteProv!NroComp
        Case 5: VNroFact = "000" & rsCtaCteProv!NroComp
        Case 6: VNroFact = "00" & rsCtaCteProv!NroComp
        Case 7: VNroFact = "0" & rsCtaCteProv!NroComp
        Case 8: VNroFact = rsCtaCteProv!NroComp
    End Select
    vdesccomp = VPtoVta & "-" & VNroFact
    Lista.SubItems(3) = vdesccomp
    If Not rsCtaCteProv!Debe = "" Then
        Lista.SubItems(4) = FormatNumber(rsCtaCteProv!Debe)
        VSaldo = VSaldo - rsCtaCteProv!Debe
    End If
    If Not rsCtaCteProv!Haber = "" Then
        Lista.SubItems(5) = FormatNumber(rsCtaCteProv!Haber)
        VSaldo = VSaldo + rsCtaCteProv!Haber
    End If
    Lista.SubItems(6) = FormatNumber(VSaldo)
    Lista.SubItems(7) = FormatNumber(rsCtaCteProv!SaldoComp)
    rsCtaCteProv.MoveNext
Loop

End Sub

Private Sub Command1_Click()
VFDesde = FDESDE
VSaldo = 0
VsaldoInicial = 0
'CALCULA SALDO INICIAL
CtaCte.ListItems.Clear
Set rsCtaCteProv = db.OpenRecordset("SELECT * FROM CtaCteProv WHERE Fecha < #" & Format(FDESDE, "mm/dd/yyyy") & "# AND CodProv = " & Text1 & "")
Do While Not rsCtaCteProv.EOF
    If Not rsCtaCteProv!Debe = "" Then
        VFDesde = rsCtaCteProv!Fecha
        VsaldoInicial = VsaldoInicial - rsCtaCteProv!Debe
    End If
    If Not rsCtaCteProv!Haber = "" Then
        VsaldoInicial = VsaldoInicial + rsCtaCteProv!Haber
    End If
    rsCtaCteProv.MoveNext
Loop
Set Lista = CtaCte.ListItems.Add(, , "")
Lista.SubItems(2) = "Saldo Inicial"
Lista.SubItems(6) = FormatNumber(VsaldoInicial)
Set rsCtaCteProv = Nothing
'BUSCA DETALLE DEL MAYOR
Set rsCtaCteProv = db.OpenRecordset("SELECT * FROM CtaCteProv WHERE CodProv = " & Text1 & " AND Fecha BETWEEN # " + Format(FDESDE, "mm/dd/yyyy") + " # AND # " + Format(FHASTA, "mm/dd/yyyy") + " # ORDER BY Fecha")
VSaldo = VsaldoInicial
Do While Not rsCtaCteProv.EOF
    Set Lista = CtaCte.ListItems.Add(, , rsCtaCteProv!Fecha)
    Lista.Tag = rsCtaCteProv!Fecha
    Lista.SubItems(1) = rsCtaCteProv!TipoComp
    Set rsComprobantes = db.OpenRecordset("SELECT * FROM Comprobantes WHERE CodComp = " & rsCtaCteProv!TipoComp & "")
    Lista.SubItems(2) = rsComprobantes!DescComp
    Set rsComprobantes = Nothing
    VTamaño = Len(rsCtaCteProv!PtoVta)
    Select Case VTamaño
        Case 1: VPtoVta = "000" & rsCtaCteProv!PtoVta
        Case 2: VPtoVta = "00" & rsCtaCteProv!PtoVta
        Case 3: VPtoVta = "0" & rsCtaCteProv!PtoVta
        Case 4: VPtoVta = rsCtaCteProv!PtoVta
    End Select
    VTamaño = Len(rsCtaCteProv!NroComp)
    Select Case VTamaño
        Case 1: VNroFact = "0000000" & rsCtaCteProv!NroComp
        Case 2: VNroFact = "000000" & rsCtaCteProv!NroComp
        Case 3: VNroFact = "00000" & rsCtaCteProv!NroComp
        Case 4: VNroFact = "0000" & rsCtaCteProv!NroComp
        Case 5: VNroFact = "000" & rsCtaCteProv!NroComp
        Case 6: VNroFact = "00" & rsCtaCteProv!NroComp
        Case 7: VNroFact = "0" & rsCtaCteProv!NroComp
        Case 8: VNroFact = rsCtaCteProv!NroComp
    End Select
    vdesccomp = VPtoVta & "-" & VNroFact
    Lista.SubItems(3) = vdesccomp
    If Not rsCtaCteProv!Debe = "" Then
        Lista.SubItems(4) = FormatNumber(rsCtaCteProv!Debe)
        VSaldo = VSaldo - rsCtaCteProv!Debe
    End If
    If Not rsCtaCteProv!Haber = "" Then
        Lista.SubItems(5) = FormatNumber(rsCtaCteProv!Haber)
        VSaldo = VSaldo + rsCtaCteProv!Haber
    End If
    Lista.SubItems(6) = FormatNumber(VSaldo)
    Lista.SubItems(7) = FormatNumber(rsCtaCteProv!SaldoComp)
    rsCtaCteProv.MoveNext
Loop
If VSaldo < 0 Then
    With rsCtaCteProv
        .AddNew
        .Fields("Fecha") = FHASTA
        .Fields("CodProv") = Text1
        .Fields("PtoVta") = 1
        .Fields("NroComp") = 999
        .Fields("TipoComp") = 1
        .Fields("haber") = FormatNumber(VSaldo * -1)
        .Update
    End With
Else
     With rsCtaCteProv
        .AddNew
        .Fields("Fecha") = FHASTA
        .Fields("CodProv") = Text1
        .Fields("PtoVta") = 1
        .Fields("NroComp") = 999
        .Fields("TipoComp") = 4
        .Fields("Debe") = FormatNumber(VSaldo)
        .Update
    End With
End If
End Sub

Private Sub Form_KeyDown(KeyCode As Integer, Shift As Integer)
Select Case KeyCode
Case vbKeyF3: Call Busc
End Select

End Sub
Private Sub Busc()
With BuscFlet
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
FDESDE.Mask = ""
FDESDE.Text = ""
FDESDE.Mask = "##/##/####"
FHASTA.Mask = ""
FHASTA.Text = ""
FHASTA.Mask = "##/##/####"

End Sub

Private Sub KewlButtons1_Click()
If Not Text1 = "" Then
    Dim LINEAY As Double, LCtaCte As ListItem
    Printer.ScaleMode = 6
    Printer.Font = Arial
    Printer.FontSize = 10
    Printer.CurrentX = 10: Printer.CurrentY = 5
    Printer.Print "Transporte Trans-Magg S.R.L."
    Printer.CurrentX = 120: Printer.CurrentY = 5
    Printer.Print "Fecha del Informe:   " & Date
    Printer.CurrentX = 60: Printer.CurrentY = 15
    Printer.Print "Consulta de Cuenta Corriente"
    Printer.CurrentX = 10: Printer.CurrentY = 25
    Printer.Print "Empresa:   " & Text1 & "       "; Label2
    Printer.CurrentX = 10: Printer.CurrentY = 30
    Printer.Print "Desde:  " & FDESDE
    Printer.CurrentX = 70: Printer.CurrentY = 30
    Printer.Print "Hasta:  " & FHASTA
    Printer.CurrentY = 35: Printer.CurrentX = 15
    Printer.Print "Fecha"
    Printer.CurrentY = 35: Printer.CurrentX = 40
    Printer.Print "Comprobante"
    Printer.CurrentY = 35: Printer.CurrentX = 75
    Printer.Print "Número"
    Printer.CurrentY = 35: Printer.CurrentX = 112
    Printer.Print "Debe"
    Printer.CurrentY = 35: Printer.CurrentX = 135
    Printer.Print "Haber"
    Printer.CurrentY = 35: Printer.CurrentX = 155
    Printer.Print "Saldo"
    Printer.CurrentY = 35: Printer.CurrentX = 177
    Printer.Print "Saldo Comp"
    Printer.Line (10, 40)-(190, 40)
    LINEAY = 40
    x = 0
    For x = x + 1 To CtaCte.ListItems.Count
        Set LCtaCte = CtaCte.ListItems.Item(x)
        If LINEAY > 250 Then
            Printer.NewPage
            Printer.CurrentX = 10: Printer.CurrentY = 5
            Printer.Print "Transporte Trans-Magg S.R.L."
            Printer.CurrentX = 120: Printer.CurrentY = 5
            Printer.Print "Fecha del Informe:   " & Date
            Printer.CurrentX = 60: Printer.CurrentY = 15
            Printer.Print "Consulta de Cuenta Corriente"
            Printer.CurrentX = 10: Printer.CurrentY = 25
            Printer.Print "Empresa:   " & Text1 & "       "; Label2
            Printer.CurrentX = 10: Printer.CurrentY = 30
            Printer.Print "Desde:  " & FDESDE
            Printer.CurrentX = 70: Printer.CurrentY = 30
            Printer.Print "Hasta:  " & FHASTA
            
            Printer.CurrentY = 35: Printer.CurrentX = 15
            Printer.Print "Fecha"
            Printer.CurrentY = 35: Printer.CurrentX = 40
            Printer.Print "Comprobante"
            Printer.CurrentY = 35: Printer.CurrentX = 75
            Printer.Print "Número"
            Printer.CurrentY = 35: Printer.CurrentX = 112
            Printer.Print "Debe"
            Printer.CurrentY = 35: Printer.CurrentX = 135
            Printer.Print "Haber"
            Printer.CurrentY = 35: Printer.CurrentX = 155
            Printer.Print "Saldo"
            Printer.CurrentY = 35: Printer.CurrentX = 177
            Printer.Print "Saldo Comp"
            Printer.Line (10, 40)-(190, 40)
            LINEAY = 40
        End If
            Printer.CurrentY = LINEAY: Printer.CurrentX = 10
            Printer.Print LCtaCte.Tag
            Printer.CurrentY = LINEAY: Printer.CurrentX = 30
            Printer.Print LCtaCte.SubItems(2)
            Printer.CurrentY = LINEAY: Printer.CurrentX = 70
            Printer.Print LCtaCte.SubItems(3)
            Printer.CurrentY = LINEAY: Printer.CurrentX = 105
            Printer.Print LCtaCte.SubItems(4)
            Printer.CurrentY = LINEAY: Printer.CurrentX = 130
            Printer.Print LCtaCte.SubItems(5)
            Printer.CurrentY = LINEAY: Printer.CurrentX = 150
            Printer.Print LCtaCte.SubItems(6)
            Printer.CurrentY = LINEAY: Printer.CurrentX = 180
            Printer.Print LCtaCte.SubItems(7)
            LINEAY = LINEAY + 5
            'Printer.CurrentY = LINEAY: Printer.CurrentX = 110
            'Printer.Print LCtaCte.SubItems(8)
    Next
Printer.EndDoc
End If

End Sub

Private Sub Text1_LostFocus()
If Not Text1 = "" Then
    Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & Text1 & "")
    If Not rsFleteros.EOF And Not rsFleteros.BOF Then
        Label2 = rsFleteros!DescFlet
    Else
        MsgBox "El fletero no Existe", vbInformation
        Text1.SetFocus
    End If
End If

End Sub


