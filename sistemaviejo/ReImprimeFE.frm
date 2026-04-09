VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Begin VB.Form ReImprimeFE 
   BackColor       =   &H80000007&
   Caption         =   "Consulta y Eliminar comprobante"
   ClientHeight    =   2370
   ClientLeft      =   60
   ClientTop       =   345
   ClientWidth     =   5190
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   2370
   ScaleWidth      =   5190
   Begin VB.ComboBox Entidad 
      Height          =   315
      Left            =   1680
      TabIndex        =   6
      Text            =   "Combo1"
      Top             =   240
      Width           =   2415
   End
   Begin VB.ComboBox Comprobante 
      Height          =   315
      Left            =   1680
      TabIndex        =   5
      Text            =   "Combo1"
      Top             =   720
      Width           =   2415
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   2400
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   1200
      Width           =   1935
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   1440
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   1200
      Width           =   855
   End
   Begin KewlButtonz.KewlButtons Opcion 
      Height          =   495
      Index           =   1
      Left            =   600
      TabIndex        =   3
      Top             =   1680
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Visualizar"
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
      FCOL            =   12632256
      FCOLO           =   4210752
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "ReImprimeFE.frx":0000
      PICN            =   "ReImprimeFE.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Eliminar 
      Height          =   495
      Left            =   2760
      TabIndex        =   8
      Top             =   1680
      Width           =   1455
      _ExtentX        =   2566
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Eliminar"
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
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "ReImprimeFE.frx":27CE
      PICN            =   "ReImprimeFE.frx":27EA
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Label Label3 
      BackColor       =   &H80000007&
      Caption         =   "Cliente"
      ForeColor       =   &H000080FF&
      Height          =   255
      Left            =   360
      TabIndex        =   7
      Top             =   240
      Width           =   1215
   End
   Begin VB.Label Label2 
      BackColor       =   &H80000007&
      Caption         =   "Comprobante "
      ForeColor       =   &H000080FF&
      Height          =   255
      Left            =   360
      TabIndex        =   4
      Top             =   720
      Width           =   1215
   End
   Begin VB.Label Label1 
      BackColor       =   &H80000007&
      Caption         =   "Factura Nro:"
      ForeColor       =   &H000080FF&
      Height          =   375
      Left            =   360
      TabIndex        =   0
      Top             =   1200
      Width           =   1215
   End
End
Attribute VB_Name = "ReImprimeFE"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub Eliminar_Click()
On Error Resume Next
If Comprobante.ListIndex = 0 Then
        VtipoComp = 16
        VTipoComp1 = 1
    ElseIf Comprobante.ListIndex = 1 Then
        VtipoComp = 18
        VTipoComp1 = 2
    ElseIf Comprobante.ListIndex = 2 Then
        VtipoComp = 17
        VTipoComp1 = 3
    ElseIf Comprobante.ListIndex = 3 Then
       VtipoComp = 201
       VTipoComp1 = 201
    Else
        VtipoComp = 203
        VTipoComp1 = 203
    End If
    Set rsEncabFact = db.OpenRecordset("Select * from EncabFE Where NroFE = " & Text1(1) & " and PtoVtaFE = " & Text1(0) & " and TipoSistema = " & VtipoComp & "")
    If IsNull(rsEncabFact!CAE) Then
        Set rsDetFact = db.OpenRecordset("Select * from DetFE Where NroFact = " & rsEncabFact!NroFE & " and PtoVta = " & rsEncabFact!PtoVtaFE & " and TipoComp = " & VTipoComp1 & "")
        Do While Not rsDetFact.EOF
            Set rsViajes = db.OpenRecordset("Select * From LiqDetViajes Where NroRemito = '" & rsDetFact!NroRem & "'")
            rsViajes.Edit
            rsViajes!Facturado = "NO"
            rsViajes.Update
            rsDetFact.Delete
            rsDetFact.MoveNext
        Loop
        Set rsCtaCteEmp = db.OpenRecordset("Select * From CtaCteEmp Where PtoVta = " & rsEncabFact!PtoVtaFE & " and NroComp = " & rsEncabFact!NroFE & " and TipoComp = " & VtipoComp & "")
        rsCtaCteEmp.Delete
        rsEncabFact.Delete
        MsgBox "Comprobante eliminado correctamente"
    Else
        MsgBox "No se puede anular el comprobante porque tiene CAE generado"
    End If
End Sub

Private Sub Form_Load()
Text1(0) = ""
Text1(1) = ""
Comprobante.Clear
Comprobante.AddItem "Factura Electrónica"
Comprobante.AddItem "Nota de Débito"
Comprobante.AddItem "Nota de Crédito"
Comprobante.AddItem "Factura MiPyme"
Comprobante.AddItem "Nota de Credito Pyme"
Entidad.Clear
Entidad.AddItem "Fletero"
Entidad.AddItem "Empresa"
End Sub

Private Sub Opcion_Click(Index As Integer)
On Error Resume Next

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
    If Comprobante.ListIndex = 0 Then
        Call Consulta_FA
    ElseIf Comprobante.ListIndex = 1 Then
        Call Consulta_ND
    ElseIf Comprobante.ListIndex = 2 Then
        Call Consulta_NC
    ElseIf Comprobante.ListIndex = 3 Then
        Call Consulta_MiPyme
    Else
        Call Consulta_NCPyme
    End If

End Sub
Private Sub Consulta_MiPyme()
Dim cALetra As New clsNum2Let
Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where NroFE = " & Text1(1) & " and PtoVtaFE = " & Text1(0) & " and TipoSistema = 201")
Set rsDetFact = db.OpenRecordset("Select * From DetFE Where NroFact = " & Text1(1) & " and TipoComp = 201 and PtoVta = " & Text1(0) & "")

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
        .Fields(QR) = rsEncabFact!QR
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
    Dim frmRep As New InfFMiPyme
    frmRep.Show vbModal
End If

End Sub
Private Sub Consulta_NCPyme()
On Error Resume Next
Dim cALetra As New clsNum2Let
Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where NroFE = " & Text1(1) & " and PtoVtaFE = " & Text1(0) & " and TipoSistema = 203")
Set rsDetFact = db.OpenRecordset("Select * From DetFE Where NroFact = " & Text1(1) & " and TipoComp = 203 and PtoVta = " & Text1(0) & "")

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
    Dim frmRep As New InfNC_FEP
    frmRep.Show vbModal
End If

End Sub
Private Sub Consulta_ND()
Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where NroFE = " & Text1(1) & " and PtoVtaFE = " & Text1(0) & " and TipoSistema = 18")
Set rsDetFact = db.OpenRecordset("Select * From DetFE Where NroFact = " & Text1(1) & " and TipoComp = 2 and PtoVta = " & Text1(0) & "")
 With TrsEncabFact
        .AddNew
        .Fields("NroFact") = rsEncabFact!NroFE
        .Fields("Fecha") = rsEncabFact!FechaFE
        .Fields("Codigo") = rsEncabFact!CodClie
        If Entidad.ListIndex = 0 Then
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
    Dim frmRep As New InfND_E
    frmRep.Show vbModal

End Sub
Private Sub Consulta_NC()
Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where NroFE = " & Text1(1) & " and PtoVtaFE = " & Text1(0) & " and TipoSistema = 17")
Set rsDetFact = db.OpenRecordset("Select * From DetFE Where NroFact = " & Text1(1) & " and TipoComp = 3 and PtoVta = " & Text1(0) & "")
 With TrsEncabFact
        .AddNew
        .Fields("NroFact") = rsEncabFact!NroFE
        .Fields("Fecha") = rsEncabFact!FechaFE
        .Fields("Codigo") = rsEncabFact!CodClie
        If Entidad.ListIndex = 0 Then
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
    Dim frmRep As New InfNC_FE
    frmRep.Show vbModal
End Sub
Private Sub Consulta_FA()
Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where NroFE = " & Text1(1) & " and PtoVtaFE = " & Text1(0) & " and TipoSistema = 16")
Set rsDetFact = db.OpenRecordset("Select * From DetFE Where NroFact = " & Text1(1) & " and TipoComp = 1 and PtoVta = " & Text1(0) & "")

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
      Dim frmRep As New InfFactura
            
    frmRep.Show vbModal
End If
End Sub

Private Sub Text1_LostFocus(Index As Integer)
Dim largo As Integer
Select Case Index
    Case 0:
        largo = Len(Text1(0))
        Select Case largo
            Case 1: Text1(0) = "000" & Text1(0)
            Case 2: Text1(0) = "00" & Text1(0)
            Case 3: Text1(0) = "0" & Text1(0)
        End Select
    Case 1:
        largo = Len(Text1(1))
         Select Case largo
            Case 1: Text1(1) = "0000000" & Text1(1)
            Case 2: Text1(1) = "000000" & Text1(1)
            Case 3: Text1(1) = "00000" & Text1(1)
            Case 4: Text1(1) = "0000" & Text1(1)
            Case 5: Text1(1) = "000" & Text1(1)
            Case 6: Text1(1) = "00" & Text1(1)
            Case 7: Text1(1) = "0" & Text1(1)
        
        End Select
End Select
End Sub
