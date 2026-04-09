VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form ConsCtaCteEmp 
   BackColor       =   &H80000007&
   Caption         =   "Consulta Cuenta Corriente de Empresas"
   ClientHeight    =   5520
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   11610
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   5520
   ScaleWidth      =   11610
   Begin VB.CommandButton Command2 
      Caption         =   "Command2"
      Height          =   255
      Left            =   4320
      TabIndex        =   11
      Top             =   600
      Width           =   615
   End
   Begin VB.CommandButton Command1 
      Caption         =   "Command1"
      Height          =   255
      Left            =   3120
      TabIndex        =   10
      Top             =   600
      Width           =   855
   End
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
      Height          =   735
      Left            =   8160
      TabIndex        =   3
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
      MICON           =   "ConsCtaCteEmp.frx":0000
      PICN            =   "ConsCtaCteEmp.frx":001C
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
      Left            =   9720
      TabIndex        =   9
      Top             =   240
      Width           =   1695
      _ExtentX        =   2990
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
      MICON           =   "ConsCtaCteEmp.frx":1D26
      PICN            =   "ConsCtaCteEmp.frx":1D42
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
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
      TabIndex        =   8
      Top             =   240
      Width           =   1095
   End
   Begin VB.Label Label2 
      BackColor       =   &H80000005&
      BorderStyle     =   1  'Fixed Single
      Caption         =   "Label2"
      Height          =   285
      Left            =   2640
      TabIndex        =   7
      Top             =   240
      Width           =   5415
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
      TabIndex        =   6
      Top             =   600
      Width           =   1095
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
      TabIndex        =   5
      Top             =   600
      Width           =   1095
   End
End
Attribute VB_Name = "ConsCtaCteEmp"
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
    MsgBox "Debe Ingresar un Fletero", vbInformation
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
Set rsCtaCteEmp = db.OpenRecordset("SELECT * FROM CtaCteEmp WHERE Fecha < #" & Format(FDESDE, "mm/dd/yyyy") & "# AND CodEmp = " & Text1 & "")
Do While Not rsCtaCteEmp.EOF
    If Not rsCtaCteEmp!debe = "" Then
        VFDesde = rsCtaCteEmp!Fecha
        VsaldoInicial = VsaldoInicial + rsCtaCteEmp!debe
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
Set rsCtaCteEmp = db.OpenRecordset("SELECT * FROM CtaCteEmp WHERE CodEmp = " & Text1 & " AND Fecha BETWEEN # " + Format(FDESDE, "mm/dd/yyyy") + " # AND # " + Format(FHASTA, "mm/dd/yyyy") + " # ORDER BY Fecha")
VSaldo = VsaldoInicial
Do While Not rsCtaCteEmp.EOF
    Set Lista = CtaCte.ListItems.Add(, , rsCtaCteEmp!Fecha)
    Lista.Tag = rsCtaCteEmp!Fecha
    Lista.SubItems(1) = rsCtaCteEmp!TipoComp
    Set rsComprobantes = db.OpenRecordset("SELECT * FROM Comprobantes WHERE CodComp = " & rsCtaCteEmp!TipoComp & "")
    Lista.SubItems(2) = rsComprobantes!DescComp
    Set rsComprobantes = Nothing
    VTamaño = Len(rsCtaCteEmp!PtoVta)
    Select Case VTamaño
        Case 1: VPtoVta = "000" & rsCtaCteEmp!PtoVta
        Case 2: VPtoVta = "00" & rsCtaCteEmp!PtoVta
        Case 3: VPtoVta = "0" & rsCtaCteEmp!PtoVta
        Case 4: VPtoVta = rsCtaCteEmp!PtoVta
    End Select
    VTamaño = Len(rsCtaCteEmp!NroComp)
    Select Case VTamaño
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
    If Not rsCtaCteEmp!debe = "" Then
        Lista.SubItems(4) = FormatNumber(rsCtaCteEmp!debe)
        VSaldo = VSaldo + rsCtaCteEmp!debe
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

Private Sub Command1_Click()
CtaCte.ListItems.Clear
Set rsCtaCteEmp = db.OpenRecordset("SELECT * FROM CtaCteEmp WHERE Fecha < #" & Format(FDESDE, "mm/dd/yyyy") & "# AND CodEmp = " & Text1 & "")
Do While Not rsCtaCteEmp.EOF
    If Not rsCtaCteEmp!debe = "" Then
        VFDesde = rsCtaCteEmp!Fecha
        VsaldoInicial = VsaldoInicial + rsCtaCteEmp!debe
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
Set rsCtaCteEmp = db.OpenRecordset("SELECT * FROM CtaCteEmp WHERE CodEmp = " & Text1 & " AND Fecha BETWEEN # " + Format(FDESDE, "mm/dd/yyyy") + " # AND # " + Format(FHASTA, "mm/dd/yyyy") + " # ORDER BY Fecha")
VSaldo = VsaldoInicial
Do While Not rsCtaCteEmp.EOF
    Set Lista = CtaCte.ListItems.Add(, , rsCtaCteEmp!Fecha)
    Lista.Tag = rsCtaCteEmp!Fecha
    Lista.SubItems(1) = rsCtaCteEmp!TipoComp
    Set rsComprobantes = db.OpenRecordset("SELECT * FROM Comprobantes WHERE CodComp = " & rsCtaCteEmp!TipoComp & "")
    Lista.SubItems(2) = rsComprobantes!DescComp
    Set rsComprobantes = Nothing
    VTamaño = Len(rsCtaCteEmp!PtoVta)
    Select Case VTamaño
        Case 1: VPtoVta = "000" & rsCtaCteEmp!PtoVta
        Case 2: VPtoVta = "00" & rsCtaCteEmp!PtoVta
        Case 3: VPtoVta = "0" & rsCtaCteEmp!PtoVta
        Case 4: VPtoVta = rsCtaCteEmp!PtoVta
    End Select
    VTamaño = Len(rsCtaCteEmp!NroComp)
    Select Case VTamaño
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
    If Not rsCtaCteEmp!debe = "" Then
        Lista.SubItems(4) = FormatNumber(rsCtaCteEmp!debe)
        VSaldo = VSaldo + rsCtaCteEmp!debe
    End If
    If Not rsCtaCteEmp!Haber = "" Then
        Lista.SubItems(5) = FormatNumber(rsCtaCteEmp!Haber)
        VSaldo = VSaldo - rsCtaCteEmp!Haber
    End If
    Lista.SubItems(6) = FormatNumber(VSaldo)
    Lista.SubItems(7) = FormatNumber(rsCtaCteEmp!SaldoComp)
    rsCtaCteEmp.MoveNext
Loop
If VSaldo < 0 Then
    With rsCtaCteEmp
        .AddNew
        .Fields("Fecha") = FHASTA
        .Fields("CodEmp") = Text1
        .Fields("PtoVta") = 1
        .Fields("NroComp") = 999
        .Fields("TipoComp") = 1
        .Fields("debe") = FormatNumber(VSaldo * -1)
        .Update
    End With
Else
     With rsCtaCteEmp
        .AddNew
        .Fields("Fecha") = FHASTA
        .Fields("CodEmp") = Text1
        .Fields("PtoVta") = 1
        .Fields("NroComp") = 999
        .Fields("TipoComp") = 4
        .Fields("haber") = FormatNumber(VSaldo)
        .Update
    End With
End If

End Sub

Private Sub Command2_Click()
Set rsCtaCteEmp = db.OpenRecordset("SELECT * FROM CtaCteEmp WHERE NroComp = 0")
Do While Not rsCtaCteEmp.EOF
    If Not rsCtaCteEmp!debe = "" Then
    Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where TotalGralFe = " & rsCtaCteEmp!debe & "")
   rsCtaCteEmp.Edit
   rsCtaCteEmp.Fields("NroComp") = rsEncabFact!nrofe
   rsCtaCteEmp.Update
   End If
   rsCtaCteEmp.MoveNext
   
Loop

End Sub

Private Sub CtaCte_Click()
Set Lista = CtaCte.ListItems.Item(CtaCte.SelectedItem.Index)
If Lista.SubItems(1) = 13 Then
    i = 5
    For i = i + 1 To Len(Lista.SubItems(3))
        DIGITO = Mid(Lista.SubItems(3), i, 1)
        If Not DIGITO = "0" Then
            VNroFact = Mid(Lista.SubItems(3), i, Len(Lista.SubItems(3)))
            Exit For
        End If
    Next
    Set rsEncabFactCta = db.OpenRecordset("Select * From EncabFactCta Where NroFact = " & VNroFact & "")
    Set rsDetFactCta = db.OpenRecordset("Select * From DetFactCta Where NroFact = " & VNroFact & "")
    Set TrsEncabFactCta = dbTemp.OpenRecordset("EncabFactCta")
    Set TrsDetFactCta = dbTemp.OpenRecordset("DetFactCta")
    'graba encabezado
    Do While Not TrsEncabFactCta.EOF
        TrsEncabFactCta.Delete
        TrsEncabFactCta.MoveNext
    Loop
    With TrsEncabFactCta
        .AddNew
        .Fields("NroFact") = rsEncabFactCta.Fields("NroFact")
        .Fields("Fecha") = rsEncabFactCta.Fields("Fecha")
        .Fields("Codigo") = rsEncabFactCta.Fields("Codigo")
        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFactCta.Fields("Codigo") & "")
        .Fields("DescEmp") = rsEmpresas!DescEmpresas
        Set rsEmpresas = Nothing
        .Fields("TipoFact") = 3 '1 - Factura Viajes, 2- Factura de Comisión
        .Fields("TNeto") = rsEncabFactCta.Fields("TNeto")
        .Fields("TIVA") = rsEncabFactCta.Fields("TIVA")
        .Fields("TGral") = rsEncabFactCta.Fields("TGral")
        .Update
    End With
    'graba detalle
    Items = 0
    Do While Not TrsDetFactCta.EOF
        TrsDetFactCta.Delete
        TrsDetFactCta.MoveNext
    Loop
    Do While Not rsDetFactCta.EOF
        With TrsDetFactCta
            .AddNew
            .Fields("NroFact") = rsDetFactCta.Fields("NroFact")
            .Fields("FechaViaje") = rsDetFactCta.Fields("FechaViaje")
            .Fields("NroRem") = rsDetFactCta.Fields("NroRem")
            .Fields("Chofer") = rsDetFactCta.Fields("Chofer")
            .Fields("Mercaderia") = rsDetFactCta.Fields("Mercaderia")
            .Fields("Procedencia") = rsDetFactCta.Fields("Procedencia")
            .Fields("Destino") = rsDetFactCta.Fields("Destino")
            .Fields("Kilos") = rsDetFactCta.Fields("Kilos")
            .Fields("Tarifa") = rsDetFactCta.Fields("Tarifa")
            .Fields("STotal") = rsDetFactCta.Fields("STotal")
            .Fields("CodFlet") = rsDetFactCta.Fields("CodFlet")
            Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsDetFactCta.Fields("CodFlet") & "")
            .Fields("DescFlet") = rsFleteros!DescFlet
            Set rslfeteros = Nothing
            .Update
        End With
        rsDetFactCta.MoveNext
    Loop
    Dim frmRep As New InfConsFactCta
    frmRep.Show vbModal
ElseIf Lista.SubItems(1) = 14 Then 'NC por cta y orden
    i = 5
    For i = i + 1 To Len(Lista.SubItems(3))
        DIGITO = Mid(Lista.SubItems(3), i, 1)
        If Not DIGITO = "0" Then
            VNroFact = Mid(Lista.SubItems(3), i, Len(Lista.SubItems(3)))
            Exit For
        End If
    Next
    Set rsEncabFactCta = db.OpenRecordset("Select * From EncabFactCta Where NroFact = " & VNroFact & "")
    Set rsDetFactCta = db.OpenRecordset("Select * From DetFactCta Where NroFact = " & VNroFact & "")
    Set rsAplicRec = db.OpenRecordset("Select * From AplicRec Where NroRec = " & VNroFact & "")
    Set TrsEncabFactCta = dbTemp.OpenRecordset("EncabFactCta")
    Set TrsDetFactCta = dbTemp.OpenRecordset("DetFactCta")
    Set TrsAplicRec = dbTemp.OpenRecordset("AplicRec")
    'graba encabezado
    Do While Not TrsEncabFactCta.EOF
        TrsEncabFactCta.Delete
        TrsEncabFactCta.MoveNext
    Loop
    With TrsEncabFactCta
        .AddNew
        .Fields("NroFact") = rsEncabFactCta.Fields("NroFact")
        .Fields("Fecha") = rsEncabFactCta.Fields("Fecha")
        .Fields("Codigo") = rsEncabFactCta.Fields("Codigo")
        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFactCta.Fields("Codigo") & "")
        .Fields("DescEmp") = rsEmpresas!DescEmpresas
        Set rsEmpresas = Nothing
        .Fields("TipoFact") = 3 '1 - Factura Viajes, 2- Factura de Comisión
        .Fields("TNeto") = rsEncabFactCta.Fields("TNeto")
        .Fields("TIVA") = rsEncabFactCta.Fields("TIVA")
        .Fields("TGral") = rsEncabFactCta.Fields("TGral")
        .Update
    End With
    'graba detalle
    Items = 0
    Do While Not TrsDetFactCta.EOF
        TrsDetFactCta.Delete
        TrsDetFactCta.MoveNext
    Loop
    Do While Not rsDetFactCta.EOF
        With TrsDetFactCta
            .AddNew
            .Fields("NroFact") = rsDetFactCta.Fields("NroFact")
            .Fields("FechaViaje") = rsDetFactCta.Fields("FechaViaje")
            .Fields("NroRem") = rsDetFactCta.Fields("NroRem")
            .Fields("Chofer") = rsDetFactCta.Fields("Chofer")
            .Fields("Mercaderia") = rsDetFactCta.Fields("Mercaderia")
            .Fields("Procedencia") = rsDetFactCta.Fields("Procedencia")
            .Fields("Destino") = rsDetFactCta.Fields("Destino")
            .Fields("Kilos") = rsDetFactCta.Fields("Kilos")
            .Fields("Tarifa") = rsDetFactCta.Fields("Tarifa")
            .Fields("STotal") = rsDetFactCta.Fields("STotal")
            .Fields("CodFlet") = rsDetFactCta.Fields("CodFlet")
            .Update
        End With
        rsDetFactCta.MoveNext
    Loop
    'graba aplicacion
    Do While Not TrsAplicRec.EOF
        TrsAplicRec.Delete
        TrsAplicRec.MoveNext
    Loop
    Do While Not rsAplicRec.EOF
        With TrsAplicRec
            .AddNew
            .Fields("NroRec") = rsAplicRec!NroRec
            .Fields("PtoVta") = rsAplicRec!PtoVta
            .Fields("NroFact") = rsAplicRec!NroFact
            .Fields("ImpAplic") = rsAplicRec!impaplic
            .Update
        End With
        rsAplicRec.MoveNext
    Loop
    Dim frmRep1 As New InfConsNCCta
    frmRep1.Show vbModal
End If
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
    Set rsEmpresas = db.OpenRecordset("Select * from Empresas Where CodEmpresas = " & Text1 & "")
    If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
        Label2 = rsEmpresas!DescEmpresas
    Else
        MsgBox "El fletero no Existe", vbInformation
        Text1.SetFocus
    End If
End If

End Sub

