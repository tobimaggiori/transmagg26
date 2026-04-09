VERSION 5.00
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Begin VB.Form IVACompras 
   BackColor       =   &H80000007&
   Caption         =   "IVA Compras"
   ClientHeight    =   3360
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   5625
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   3360
   ScaleWidth      =   5625
   Begin VB.Frame Frame1 
      BackColor       =   &H80000007&
      Caption         =   "Opciones del Listado"
      ForeColor       =   &H0080C0FF&
      Height          =   975
      Left            =   360
      TabIndex        =   0
      Top             =   960
      Width           =   4935
      Begin VB.OptionButton Option1 
         BackColor       =   &H80000006&
         Caption         =   "Analitico"
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   0
         Left            =   720
         TabIndex        =   2
         Top             =   360
         Width           =   1335
      End
      Begin VB.OptionButton Option1 
         BackColor       =   &H80000006&
         Caption         =   "Total por Comprobantes"
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   1
         Left            =   2520
         TabIndex        =   1
         Top             =   360
         Width           =   2175
      End
   End
   Begin MSMask.MaskEdBox FHasta 
      Height          =   285
      Left            =   4080
      TabIndex        =   3
      Top             =   480
      Width           =   1215
      _ExtentX        =   2143
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin MSMask.MaskEdBox FDesde 
      Height          =   285
      Left            =   1560
      TabIndex        =   4
      Top             =   480
      Width           =   1215
      _ExtentX        =   2143
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.PictureBox Consultar 
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8,25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   495
      Left            =   480
      ScaleHeight     =   435
      ScaleWidth      =   4635
      TabIndex        =   5
      Top             =   2160
      Width           =   4695
   End
   Begin VB.PictureBox Exportar 
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8,25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   495
      Left            =   480
      ScaleHeight     =   435
      ScaleWidth      =   4635
      TabIndex        =   8
      Top             =   2760
      Width           =   4695
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Desde Fecha"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8,25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Left            =   120
      TabIndex        =   7
      Top             =   480
      Width           =   1455
   End
   Begin VB.Label Label2 
      BackColor       =   &H00000000&
      Caption         =   "Hasta Fecha"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8,25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Left            =   2880
      TabIndex        =   6
      Top             =   480
      Width           =   1455
   End
End
Attribute VB_Name = "IVACompras"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
 Private Sub Consultar_Click()

If IsDate(FDESDE) = False Or IsDate(FHASTA) = False Then
    MsgBox "Fecha Incorrecta", vbInformation
    Exit Sub
End If
If Format(FHASTA, "dd/mm/yyyy") < Format(FDESDE, "dd/mm/yyyy") Then
    MsgBox "Fecha de Hasta mayor que Fecha Desde", vbInformation
    Exit Sub
End If
'limpia temporales
Set TrsIVAVentas = dbTemp.OpenRecordset("IVA_Ventas")
If Not TrsIVAVentas.EOF And Not TrsIVAVentas.BOF Then
    Do While Not TrsIVAVentas.EOF
        TrsIVAVentas.Delete
        TrsIVAVentas.MoveNext
    Loop
End If
Set TrsConsultas = dbTemp.OpenRecordset("Consultas")
If Not TrsConsultas.EOF And Not TrsConsultas.BOF Then
    Do While Not TrsConsultas.EOF
        TrsConsultas.Delete
        TrsConsultas.MoveNext
    Loop
End If
If Option1(0).Value = True Then
    'graba inf del periodo
    With TrsConsultas
        .AddNew
        .Fields("FDede") = FDESDE
        .Fields("FHasta") = FHASTA
        .Update
    End With
    Set rsEncabFactProv = db.OpenRecordset("SELECT * FROM encabfactProv WHERE Fecha BETWEEN # " + Format(FDESDE, "mm/dd/yyyy") + " # AND # " + Format(FHASTA, "mm/dd/yyyy") + " # AND LIVA = 'SI' ORDER BY Fecha")
    With TrsIVAVentas
    Do While Not rsEncabFactProv.EOF
        .AddNew
        .Fields("Fecha") = rsEncabFactProv!Fecha
        If rsEncabFactProv!codprov = 99999 Then
            .Fields("DescProv") = "ANULADO"
            .Fields("PtoVta") = "0001"
            Tamaño = Len(rsencabfactprovProv!NroFact)
            Select Case Tamaño
                Case 1: VNro = "0000000" & rsEncabFactProv!NroFact
                Case 2: VNro = "000000" & rsEncabFactProv!NroFact
                Case 3: VNro = "00000" & rsEncabFactProv!NroFact
                Case 4: VNro = "0000" & rsEncabFactProv!NroFact
                Case 5: VNro = "000" & rsEncabFactProv!NroFact
                Case 6: VNro = "00" & rsEncabFactProv!NroFact
                Case 7: VNro = "0" & rsEncabFactProv!NroFact
                Case 8: VNro = rsEncabFactProv!NroFact
            End Select
            .Fields("NroFact") = VNro
            .Fields("Neto") = "0.00"
            .Fields("Exento") = "0.00"
            .Fields("IVA") = "0.00"
            .Fields("Total") = "0.00"
        Else
            .Fields("CodProv") = rsEncabFactProv!codprov
        'If rsencabfactprovProv!CodComp = 1 Then
            Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFactProv!codprov & "")
            .Fields("DescProv") = rsFleteros!DescFlet
            .Fields("CUIT") = rsFleteros!cuit
            Set rsFleteros = Nothing
        'End If
            Select Case rsEncabFactProv!CodComp
                Case 0, 1: .Fields("Comp") = "FACT"
                Case 2: .Fields("Comp") = "NC"
                Case 3: .Fields("Comp") = "ND"
            End Select
            .Fields("PtoVta") = "0001"
            Tamaño = Len(rsEncabFactProv!NroFact)
            Select Case Tamaño
                Case 1: VNro = "0000000" & rsEncabFactProv!NroFact
                Case 2: VNro = "000000" & rsEncabFactProv!NroFact
                Case 3: VNro = "00000" & rsEncabFactProv!NroFact
                Case 4: VNro = "0000" & rsEncabFactProv!NroFact
                Case 5: VNro = "000" & rsEncabFactProv!NroFact
                Case 6: VNro = "00" & rsEncabFactProv!NroFact
                Case 7: VNro = "0" & rsEncabFactProv!NroFact
                Case 8: VNro = rsEncabFactProv!NroFact
            End Select
            .Fields("NroFact") = VNro
            .Fields("PercIIBB") = rsEncabFactProv!PercIIBB
            .Fields("PercIVA") = rsEncabFactProv!PercIVA
            .Fields("OtrosImp") = rsEncabFactProv!OtrosImp
            .Fields("PercGan") = rsEncabFactProv!RetGanancia
            
            VTotalIVA = 0
            VTotalExento = 0

            Set rsDetFactProv = db.OpenRecordset("Select * From DetFactProv Where Id = " & rsEncabFactProv!ID & " and nrofact = " & rsEncabFactProv!NroFact & "")
            Do While Not rsDetFactProv.EOF
                If Not rsDetFactProv!CodConcepto = 14 And Not rsDetFactProv!CodConcepto = 16 And Not rsDetFactProv!CodConcepto = 17 And Not rsDetFactProv!CodConcepto = 18 Then
                If rsDetFactProv!porIVA = 0 Then
                    VTotalExento = VTotalExento + rsDetFactProv!Importe
                Else
                    VTotalIVA = VTotalIVA + rsDetFactProv!Importe
                End If
                End If
                rsDetFactProv.MoveNext
            Loop
            'VTotalIVA = VTotalIVA - VTotalExento
            If rsEncabFactProv!CodComp = 2 Then
                .Fields("Neto") = FormatNumber(VTotalIVA * -1)
                .Fields("Exento") = FormatNumber(VTotalExento * -1)
                .Fields("IVA") = FormatNumber(rsEncabFactProv!IVA * -1)
                .Fields("Total") = FormatNumber(rsEncabFactProv!total * -1)
            Else
                .Fields("Neto") = FormatNumber(VTotalIVA)
                .Fields("Exento") = FormatNumber(VTotalExento)
                .Fields("IVA") = FormatNumber(rsEncabFactProv!IVA)
                .Fields("Total") = FormatNumber(rsEncabFactProv!total)
            End If
        End If
        .Update
        rsEncabFactProv.MoveNext
    Loop
    End With
    'busca liquidos productos
    Set rsEncabFactProv = db.OpenRecordset("SELECT * FROM EncabLProd WHERE Fecha BETWEEN # " + Format(FDESDE, "mm/dd/yyyy") + " # AND # " + Format(FHASTA, "mm/dd/yyyy") + " # ORDER BY Fecha")
    With TrsIVAVentas
    Do While Not rsEncabFactProv.EOF
        .AddNew
        .Fields("Fecha") = rsEncabFactProv!Fecha
        If rsEncabFactProv!TotalViajes = 0 Then
            .Fields("DescProv") = "ANULADO"
            .Fields("PtoVta") = "0001"
            Tamaño = Len(rsEncabFactProv!NroComp)
            Select Case Tamaño
                Case 1: VNro = "0000000" & rsEncabFactProv!NroComp
                Case 2: VNro = "000000" & rsEncabFactProv!NroComp
                Case 3: VNro = "00000" & rsEncabFactProv!NroComp
                Case 4: VNro = "0000" & rsEncabFactProv!NroComp
                Case 5: VNro = "000" & rsEncabFactProv!NroComp
                Case 6: VNro = "00" & rsEncabFactProv!NroComp
                Case 7: VNro = "0" & rsEncabFactProv!NroComp
                Case 8: VNro = rsEncabFactProv!NroComp
            End Select
            .Fields("NroFact") = VNro
            .Fields("Neto") = "0.00"
            .Fields("Exento") = "0.00"
            .Fields("IVA") = "0.00"
            .Fields("Total") = "0.00"
        Else
            .Fields("CodProv") = rsEncabFactProv!codflet
            'If rsencabfactprovProv!CodComp = 1 Then
            Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFactProv!codflet & "")
            .Fields("DescProv") = rsFleteros!DescFlet
            .Fields("CUIT") = rsFleteros!cuit
            Set rsFleteros = Nothing
            'End If
            Select Case rsEncabFactProv!TipoAfip
                Case 0, 1: .Fields("Comp") = "FACT"
                Case 2: .Fields("Comp") = "NC"
                Case 3: .Fields("Comp") = "ND"
                Case 60: .Fields("Comp") = "Liq Prod"
            End Select
            .Fields("PtoVta") = "000" & rsEncabFactProv!PtoVta
            Tamaño = Len(rsEncabFactProv!NroComp)
            Select Case Tamaño
                Case 1: VNro = "0000000" & rsEncabFactProv!NroComp
                Case 2: VNro = "000000" & rsEncabFactProv!NroComp
                Case 3: VNro = "00000" & rsEncabFactProv!NroComp
                Case 4: VNro = "0000" & rsEncabFactProv!NroComp
                Case 5: VNro = "000" & rsEncabFactProv!NroComp
                Case 6: VNro = "00" & rsEncabFactProv!NroComp
                Case 7: VNro = "0" & rsEncabFactProv!NroComp
                Case 8: VNro = rsEncabFactProv!NroComp
            End Select
            .Fields("NroFact") = VNro
            If rsEncabFactProv!TipoAfip = 2 Then
                .Fields("Neto") = FormatNumber(rsEncabFactProv!TotalNeto * -1)
                .Fields("Exento") = "0.00"
                .Fields("IVA") = FormatNumber(rsEncabFactProv!IVA * -1)
                .Fields("Total") = FormatNumber(rsEncabFactProv!total * -1)
            Else
               ' .Fields("Neto") = FormatNumber(rsEncabFactProv!TotalViajes)
               ' .Fields("Exento") = "0.00"
               ' .Fields("IVA") = FormatNumber((rsEncabFactProv!TotalViajes * 21) / 100)
               ' .Fields("Total") = FormatNumber(rsEncabFactProv!TotalViajes * 1.21)
            
                .Fields("Neto") = FormatNumber(rsEncabFactProv!netoviajes)
                .Fields("Exento") = "0.00"
                .Fields("IVA") = FormatNumber(rsEncabFactProv!ivaviaje)
                .Fields("Total") = FormatNumber(rsEncabFactProv!totalviajeS1)
            End If
        End If
        .Update
        rsEncabFactProv.MoveNext
    Loop
    End With
    '////////////
    Dim frmRep As New InfIVACompras
    frmRep.Show vbModal
Else
    Dim viva2 As Double
    '/// total por comprobantes ///
      With TrsConsultas
        .AddNew
        .Fields("FDede") = FDESDE
        .Fields("FHasta") = FHASTA
        .Update
    End With
    Set TrsIVAVentas = dbTemp.OpenRecordset("IVAxComp")
    Do While Not TrsIVAVentas.EOF
        TrsIVAVentas.Delete
        TrsIVAVentas.MoveNext
    Loop
    Set rsEncabFactProv = db.OpenRecordset("SELECT * FROM encabfactProv WHERE Fecha BETWEEN # " + Format(FDESDE, "mm/dd/yyyy") + " # AND # " + Format(FHASTA, "mm/dd/yyyy") + " # AND LIVA = 'SI' ORDER BY ID")
    With TrsIVAVentas
    VTotalNeto = 0
    viva2 = 0
    Do While Not rsEncabFactProv.EOF
        Set rsDetFactProv = db.OpenRecordset("Select * From DetFactProv Where Id = " & rsEncabFactProv!ID & " and PtoVta = " & rsEncabFactProv!PtoVta & " and NroFact = " & rsEncabFactProv!NroFact & " order by PorIVA")
        Do While Not rsDetFactProv.EOF
            If Not rsDetFactProv!CodConcepto = 14 And Not rsDetFactProv!CodConcepto = 16 And Not rsDetFactProv!CodConcepto = 17 And Not rsDetFactProv!CodConcepto = 18 Then
                .AddNew
                .Fields("CodComp") = rsEncabFactProv!CodComp
                Set rsComprobantes = db.OpenRecordset("Select * From Comprobantes Where CodComp = " & rsEncabFactProv!CodComp & "")
                .Fields("DescComp") = rsComprobantes!DescComp
                If rsEncabFactProv!CodComp = 1 Or rsEncabFactProv!CodComp = 3 Then
                    .Fields("Neto") = rsDetFactProv!Importe
                    If IsNull(rsDetFactProv!porIVA) Then
                        .Fields("IVA") = rsDetFactProv!Importe * 21 / 100
                        viva2 = viva2 + rsDetFactProv!Importe * 21 / 100
                        .Fields("Alicuota") = 21
                     Else
                        .Fields("IVA") = rsDetFactProv!Importe * rsDetFactProv!porIVA / 100
                        viva2 = viva2 + rsDetFactProv!Importe * rsDetFactProv!porIVA / 100
                        .Fields("Alicuota") = rsDetFactProv!porIVA
                    End If
                Else
                     If IsNull(rsDetFactProv!porIVA) Then
                         .Fields("IVA") = (rsDetFactProv!Importe * -1) * 21 / 100
                        viva2 = viva2 + (rsDetFactProv!Importe * -1) * 21 / 100
                        .Fields("Alicuota") = 21
                    Else
                        .Fields("Neto") = rsDetFactProv!Importe * -1
                        .Fields("IVA") = (rsDetFactProv!Importe * -1) * rsDetFactProv!porIVA / 100
                        viva2 = viva2 + rsDetFactProv!Importe * rsDetFactProv!porIVA / 100
                        .Fields("Alicuota") = rsDetFactProv!porIVA
                    End If
                End If
            .Update
            VTotalNeto = VTotalNeto + rsDetFactProv!Importe
            
            End If
            rsDetFactProv.MoveNext
        Loop
        If Not FormatNumber(VTotalNeto) = FormatNumber(rsEncabFactProv!TotalNeto) Or Not FormatNumber(rsEncabFactProv!IVA) = FormatNumber(viva2, 2) Then
            
            rsDetFactProv.MovePrevious
            
            MsgBox "Error en factura Nro: " & rsEncabFactProv!NroFact
            VDif = FormatNumber(rsEncabFactProv!TotalNeto) - FormatNumber(VTotalNeto)
            .AddNew
            .Fields("CodComp") = rsEncabFactProv!CodComp
            Set rsComprobantes = db.OpenRecordset("Select * From Comprobantes Where CodComp = " & rsEncabFactProv!CodComp & "")
            .Fields("DescComp") = rsComprobantes!DescComp
            If VDif > 0 Then
                If rsEncabFactProv!CodComp = 1 Then
                    If IsNull(rsDetFactProv!porIVA) Then
                        .Fields("IVA") = rsDetFactProv!Importe * 21 / 100
                        .Fields("Alicuota") = 21
                    Else
                        .Fields("IVA") = rsDetFactProv!Importe * rsDetFactProv!porIVA / 100
                        .Fields("Alicuota") = rsDetFactProv!porIVA
                    End If
                Else
                    .Fields("Neto") = rsDetFactProv!Importe * -1
                    .Fields("IVA") = (rsDetFactProv!Importe * -1) * rsDetFactProv!porIVA / 100
                End If
            Else
                If Not rsEncabFactProv!CodComp = 1 Then
                    If IsNull(rsDetFactProv!porIVA) Then
                        .Fields("IVA") = (rsDetFactProv!Importe * -1) * 21 / 100
                        .Fields("Alicuota") = 21
                    Else
                        .Fields("IVA") = rsDetFactProv!Importe * rsDetFactProv!porIVA / 100
                        .Fields("Alicuota") = rsDetFactProv!porIVA
                    End If
                Else
                    .Fields("Neto") = rsDetFactProv!Importe * -1
                    .Fields("IVA") = (rsDetFactProv!Importe * -1) * rsDetFactProv!porIVA / 100
                End If
            End If
            .Update
        End If
        rsEncabFactProv.MoveNext
        VTotalNeto = 0
        viva2 = 0
    Loop
    End With
    '' LIQUIDOS PRODUCTOS
    Set rsEncabFactProv = db.OpenRecordset("SELECT * FROM encabLPROD WHERE Fecha BETWEEN # " + Format(FDESDE, "mm/dd/yyyy") + " # AND # " + Format(FHASTA, "mm/dd/yyyy") + " # ORDER BY Fecha")
    With TrsIVAVentas
    Do While Not rsEncabFactProv.EOF
           .AddNew
            .Fields("CodComp") = rsEncabFactProv!TipoSistema
            Set rsComprobantes = db.OpenRecordset("Select * From Comprobantes Where CodComp = " & rsEncabFactProv!TipoSistema & "")
            .Fields("DescComp") = rsComprobantes!DescComp
            .Fields("Neto") = rsEncabFactProv!netoviajes
                
                    .Fields("IVA") = rsEncabFactProv!ivaviaje
                    .Fields("Alicuota") = 21
                          .Update
            
               rsEncabFactProv.MoveNext
       
    Loop
    End With
    
    
    Dim frmRep1 As New InfIVAxCompC
    frmRep1.Show vbModal

End If
End Sub

Private Sub Exportar_Click()
Dim Vfecha, VComp, VPtoVta, VNroComp, VCodDoc, VNroDoc, VAyN, VImpTotal, VNoGrabado As String
Dim VPerc, VImpExentas, VImpPagoCta, VImpPerIIBB, VImpMuni, VImpInternos, VCodMoneda, VTipoCambio As String
Dim VCantAlicIVa, VCodOperacion, VOtroTib, VFechaPago As String
Dim VLinea, VLinea1 As String
Dim Neto21, Neto0, Neto105, Neto27 As Double
Dim CantAlic As Integer
Dim VTamaño As Integer
Dim obj_FSO As Object
Dim Archivo As Object
Dim ArchivoAlic As Object
Dim NombreArch As String
Set obj_FSO = CreateObject("Scripting.FileSystemObject")
  
'Creamos un archivo con el método CreateTextFile
NombreArch = Mid(FDESDE, 7, 4) & Mid(FDESDE, 4, 2)
NombreArch = "\citi\ComprobantesCompras_" & NombreArch & ".txt"
Set Archivo = obj_FSO.CreateTextFile(App.Path + NombreArch, True)
NombreArch = Mid(FDESDE, 7, 4) & Mid(FDESDE, 4, 2)
NombreArch = "\citi\AlicCompras_" & NombreArch & ".txt"
Set ArchivoAlic = obj_FSO.CreateTextFile(App.Path + NombreArch, True)
'FACTURAS ELECTRONICAS

Set rsEncabFactProv = db.OpenRecordset("SELECT * FROM encabfactProv WHERE Fecha BETWEEN # " + Format(FDESDE, "mm/dd/yyyy") + " # AND # " + Format(FHASTA, "mm/dd/yyyy") + " # AND LIVA = 'SI' ORDER BY Fecha")
Do While Not rsEncabFactProv.EOF
    VLinea = ""
    'fecha
    Vfecha = Mid(rsEncabFactProv!Fecha, 7, 4) & Mid(rsEncabFactProv!Fecha, 4, 2) & Mid(rsEncabFactProv!Fecha, 1, 2)
    VLinea = Vfecha
    'tipo de comprobante
    VTamaño = Len(rsEncabFactProv!CodComp)
    Select Case VTamaño
        Case 1: VComp = "00" & rsEncabFactProv!CodComp
        Case 2: VComp = "0" & rsEncabFactProv!CodComp
        Case 3: VComp = rsEncabFactProv!CodComp
    End Select
    If Len(VComp) = 3 Then
        VLinea = VLinea & VComp
    Else
        MsgBox "Error VComp"
    End If
    'pto de venta
    VTamaño = Len(rsEncabFactProv!PtoVta)
    Select Case VTamaño
        Case 1: VPtoVta = "0000" & rsEncabFactProv!PtoVta
        Case 2: VPtoVta = "000" & rsEncabFactProv!PtoVta
        Case 3: VPtoVta = "00" & rsEncabFactProv!PtoVta
        Case 4: VPtoVta = "0" & rsEncabFactProv!PtoVta
        Case 5: VPtoVta = rsEncabFactProv!PtoVta
    End Select
    If Len(VPtoVta) = 5 Then
        VLinea = VLinea & VPtoVta
    Else
        MsgBox "Error en el PtoVta"
    End If
    'nro de comprobante
    VTamaño = Len(rsEncabFactProv!NroFact)
    Select Case VTamaño
        Case 1: VNroComp = "0000000000000000000" & rsEncabFactProv!NroFact
        Case 2: VNroComp = "000000000000000000" & rsEncabFactProv!NroFact
        Case 3: VNroComp = "00000000000000000" & rsEncabFactProv!NroFact
        Case 4: VNroComp = "0000000000000000" & rsEncabFactProv!NroFact
        Case 5: VNroComp = "000000000000000" & rsEncabFactProv!NroFact
        Case 6: VNroComp = "00000000000000" & rsEncabFactProv!NroFact
        Case 7: VNroComp = "0000000000000" & rsEncabFactProv!NroFact
        Case 8: VNroComp = "000000000000" & rsEncabFactProv!NroFact
        Case 9: VNroComp = "00000000000" & rsEncabFactProv!NroFact
        Case 10: VNroComp = "0000000000" & rsEncabFactProv!NroFact
        Case 11: VNroComp = "000000000" & rsEncabFactProv!NroFact
        Case 12: VNroComp = "00000000" & rsEncabFactProv!NroFact
        Case 13: VNroComp = "0000000" & rsEncabFactProv!NroFact
        Case 14: VNroComp = "000000" & rsEncabFactProv!NroFact
        Case 15: VNroComp = "00000" & rsEncabFactProv!NroFact
        Case 16: VNroComp = "0000" & rsEncabFactProv!NroFact
        Case 17: VNroComp = "000" & rsEncabFactProv!NroFact
        Case 18: VNroComp = "00" & rsEncabFactProv!NroFact
        Case 19: VNroComp = "0" & rsEncabFactProv!NroFact
        Case 20: VNroComp = rsEncabFactProv!NroFact
    End Select
    If Len(VNroComp) = 20 Then
        VLinea = VLinea & VNroComp
    Else
        MsgBox "Error en el Nro de comprobante"
    End If
    '////nro de despacho de importacion
    VNroComp1 = "                "
    VLinea = VLinea & VNroComp1
    'codigo de comprador
    VCodDoc = "80"
    VLinea = VLinea & VCodDoc
    'nro de documento o cuit
    Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFactProv!codprov & "")
    VNroDoc = "000000000" & Mid(rsFleteros!cuit, 1, 2) & Mid(rsFleteros!cuit, 4, 8) & Mid(rsFleteros!cuit, 13, 1)
    If Not Len(VNroDoc) = 20 Then
        MsgBox ("Error")
    End If
    Tamaño = 0
    Tamaño = Len(rsFleteros!DescFlet)
    Select Case Tamaño
        Case 1: VAyN = rsFleteros!DescFlet & "                             "
        Case 2: VAyN = rsFleteros!DescFlet & "                            "
        Case 3: VAyN = rsFleteros!DescFlet & "                           "
        Case 4: VAyN = rsFleteros!DescFlet & "                          "
        Case 5: VAyN = rsFleteros!DescFlet & "                         "
        Case 6: VAyN = rsFleteros!DescFlet & "                        "
        Case 7: VAyN = rsFleteros!DescFlet & "                       "
        Case 8: VAyN = rsFleteros!DescFlet & "                      "
        Case 9: VAyN = rsFleteros!DescFlet & "                     "
        Case 10: VAyN = rsFleteros!DescFlet & "                    "
        Case 11: VAyN = rsFleteros!DescFlet & "                   "
        Case 12: VAyN = rsFleteros!DescFlet & "                  "
        Case 13: VAyN = rsFleteros!DescFlet & "                 "
        Case 14: VAyN = rsFleteros!DescFlet & "                "
        Case 15: VAyN = rsFleteros!DescFlet & "               "
        Case 16: VAyN = rsFleteros!DescFlet & "              "
        Case 17: VAyN = rsFleteros!DescFlet & "             "
        Case 18: VAyN = rsFleteros!DescFlet & "            "
        Case 19: VAyN = rsFleteros!DescFlet & "           "
        Case 20: VAyN = rsFleteros!DescFlet & "          "
        Case 21: VAyN = rsFleteros!DescFlet & "         "
        Case 22: VAyN = rsFleteros!DescFlet & "        "
        Case 23: VAyN = rsFleteros!DescFlet & "       "
        Case 24: VAyN = rsFleteros!DescFlet & "      "
        Case 25: VAyN = rsFleteros!DescFlet & "     "
        Case 26: VAyN = rsFleteros!DescFlet & "    "
        Case 27: VAyN = rsFleteros!DescFlet & "   "
        Case 28: VAyN = rsFleteros!DescFlet & "  "
        Case 29: VAyN = rsFleteros!DescFlet & " "
        Case Is >= 30: VAyN = Mid(rsFleteros!DescFlet, 1, 30)
    End Select
    Set rsFleteros = Nothing
    If Len(VAyN) = 30 Then
        VLinea = VLinea & VNroDoc & VAyN
    Else
        MsgBox "Error"
    End If
    'busca importe por alicuota
    Neto21 = 0
    Neto0 = 0
    Neto27 = 0
    Neto105 = 0
    CantAlic = 0
    Set rsDetFact = db.OpenRecordset("Select * From DetFactProv Where PtoVta = " & rsEncabFactProv!PtoVta & " And NroFact = " & rsEncabFactProv!NroFact & " And Id = " & rsEncabFactProv!ID & " order by PorIVA")
    
    Do While Not rsDetFact.EOF
        If rsDetFact!porIVA = 21 Then
            If Neto21 = 0 Then
                CantAlic = CantAlic + 1
            End If
            Neto21 = Neto21 + rsDetFact!Punit
        ElseIf rsDetFact!porIVA = 10.5 Then
            If Neto105 = 0 Then
                CantAlic = CantAlic + 1
            End If
            Neto105 = Neto105 + rsDetFact!Punit
        ElseIf rsDetFact!porIVA = 27 Then
            If Neto27 = 0 Then
                CantAlic = CantAlic + 1
            End If
            Neto27 = Neto27 + rsDetFact!Punit
        ElseIf rsDetFact!porIVA = 0 Then
            If Not rsDetFact!CodConcepto = 14 And Not rsDetFact!CodConcepto = 16 And Not rsDetFact!CodConcepto = 17 And Not rsDetFact!CodConcepto = 18 Then
                If Neto0 = 0 Then
                    CantAlic = CantAlic + 1
                End If
                Neto0 = Neto0 + rsDetFact!Punit
            End If
        End If
        rsDetFact.MoveNext
    Loop
   'importe total de la operacion
    vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFactProv!total))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFactProv!total), i, 1)
        If Not DIGITO = "." And Not DIGITO = "," Then
            vimporte = vimporte & DIGITO
        End If
    Next
    vimporte = vimporte & DIGITO
    VTamaño = Len(vimporte)
    Select Case VTamaño
        Case 2: VImpTotal = "0000000000000" & vimporte
        Case 3: VImpTotal = "000000000000" & vimporte
        Case 4: VImpTotal = "00000000000" & vimporte
        Case 5: VImpTotal = "0000000000" & vimporte
        Case 6: VImpTotal = "000000000" & vimporte
        Case 7: VImpTotal = "00000000" & vimporte
        Case 8: VImpTotal = "0000000" & vimporte
        Case 9: VImpTotal = "000000" & vimporte
        Case 10: VImpTotal = "00000" & vimporte
        Case 11: VImpTotal = "0000" & vimporte
        Case 12: VImpTotal = "000" & vimporte
        Case 13: VImpTotal = "00" & vimporte
        Case 14: VImpTotal = "0" & vimporte
        Case 15: VImpTotal = vimporte
    End Select
    VLinea = VLinea & VImpTotal
    ' IMPORTE NO GRABADO
    
        VNoGrabado = "000000000000000"
        VLinea = VLinea & VNoGrabado
    
    'PERCEPCIONES A NO CATEGORIZADOS
    VPerc = "000000000000000"
    VLinea = VLinea & VPerc
    'IMPORTE OPERACIONES EXENTAS
    VImpExentas = "000000000000000"
    VLinea = VLinea & VImpExentas
    'PAGOS A CUENTAS
    'PERC IVA
    vimporte = ""
    If Not rsEncabFactProv!PercIVA = "" Then
        VTamaño = Len(FormatNumber(rsEncabFactProv!PercIVA))
        i = 0
        For i = i + 1 To VTamaño + 1
            DIGITO = Mid(FormatNumber(rsEncabFactProv!PercIVA), i, 1)
            If Not DIGITO = "." And Not DIGITO = "," Then
                vimporte = vimporte & DIGITO
            End If
        Next
        vimporte = vimporte & DIGITO
        VTamaño = Len(vimporte)
    Else
        VTamaño = 0
    End If
    
    
    Select Case VTamaño
        Case 0: VImpTotal = "000000000000000"
        Case 2: VImpTotal = "0000000000000" & vimporte
        Case 3: VImpTotal = "000000000000" & vimporte
        Case 4: VImpTotal = "00000000000" & vimporte
        Case 5: VImpTotal = "0000000000" & vimporte
        Case 6: VImpTotal = "000000000" & vimporte
        Case 7: VImpTotal = "00000000" & vimporte
        Case 8: VImpTotal = "0000000" & vimporte
        Case 9: VImpTotal = "000000" & vimporte
        Case 10: VImpTotal = "00000" & vimporte
        Case 11: VImpTotal = "0000" & vimporte
        Case 12: VImpTotal = "000" & vimporte
        Case 13: VImpTotal = "00" & vimporte
        Case 14: VImpTotal = "0" & vimporte
        Case 15: VImpTotal = vimporte
    End Select
    VLinea = VLinea & VImpTotal
    'PERC GANANCIA
    VImpPagoCta = ""
    vimporte = ""
    If Not rsEncabFactProv!RetGanancia = "" Then
        VTamaño = Len(FormatNumber(rsEncabFactProv!RetGanancia))
        i = 0
        For i = i + 1 To VTamaño + 1
            DIGITO = Mid(FormatNumber(rsEncabFactProv!RetGanancia), i, 1)
            If Not DIGITO = "." And Not DIGITO = "," Then
                vimporte = vimporte & DIGITO
            End If
        Next
        vimporte = vimporte & DIGITO
        VTamaño = Len(vimporte)
    Else
        VTamaño = 0
    End If
    Select Case VTamaño
        Case 0: VImpTotal = "000000000000000"
        Case 2: VImpTotal = "0000000000000" & vimporte
        Case 3: VImpTotal = "000000000000" & vimporte
        Case 4: VImpTotal = "00000000000" & vimporte
        Case 5: VImpTotal = "0000000000" & vimporte
        Case 6: VImpTotal = "000000000" & vimporte
        Case 7: VImpTotal = "00000000" & vimporte
        Case 8: VImpTotal = "0000000" & vimporte
        Case 9: VImpTotal = "000000" & vimporte
        Case 10: VImpTotal = "00000" & vimporte
        Case 11: VImpTotal = "0000" & vimporte
        Case 12: VImpTotal = "000" & vimporte
        Case 13: VImpTotal = "00" & vimporte
        Case 14: VImpTotal = "0" & vimporte
        Case 15: VImpTotal = vimporte
    End Select
    VLinea = VLinea & VImpTotal
    'PERCEPCIONES IIBB
    vimporte = ""
    If Not rsEncabFactProv!PercIIBB = "" Then
        VTamaño = Len(FormatNumber(rsEncabFactProv!PercIIBB))
        i = 0
        For i = i + 1 To VTamaño + 1
            DIGITO = Mid(FormatNumber(rsEncabFactProv!PercIIBB), i, 1)
            If Not DIGITO = "." And Not DIGITO = "," Then
                vimporte = vimporte & DIGITO
            End If
        Next
        vimporte = vimporte & DIGITO
        VTamaño = Len(vimporte)
    Else
        VTamaño = 0
    End If
    Select Case VTamaño
        Case 0: VImpTotal = "000000000000000"
        Case 2: VImpTotal = "0000000000000" & vimporte
        Case 3: VImpTotal = "000000000000" & vimporte
        Case 4: VImpTotal = "00000000000" & vimporte
        Case 5: VImpTotal = "0000000000" & vimporte
        Case 6: VImpTotal = "000000000" & vimporte
        Case 7: VImpTotal = "00000000" & vimporte
        Case 8: VImpTotal = "0000000" & vimporte
        Case 9: VImpTotal = "000000" & vimporte
        Case 10: VImpTotal = "00000" & vimporte
        Case 11: VImpTotal = "0000" & vimporte
        Case 12: VImpTotal = "000" & vimporte
        Case 13: VImpTotal = "00" & vimporte
        Case 14: VImpTotal = "0" & vimporte
        Case 15: VImpTotal = VImpPerIIBB
    End Select
    VLinea = VLinea & VImpTotal
    
    'IMPUESTO MUNICIPALES
    'VImpMuni = "000000000000000"
    'VLinea = VLinea & VImpMuni
    
    ' IMPUESTOS INTERNOS
    vimporte = ""
    If Not rsEncabFactProv!OtrosImp = "" Then
        VTamaño = Len(FormatNumber(rsEncabFactProv!OtrosImp))
        i = 0
        For i = i + 1 To VTamaño + 1
            DIGITO = Mid(FormatNumber(rsEncabFactProv!OtrosImp), i, 1)
            If Not DIGITO = "." And Not DIGITO = "," Then
                vimporte = vimporte & DIGITO
            End If
        Next
        vimporte = vimporte & DIGITO
        VTamaño = Len(vimporte)
    Else
        VTamaño = 0
    End If
    Select Case VTamaño
        Case 0: VImpTotal = "000000000000000"
        Case 2: VImpTotal = "0000000000000" & vimporte
        Case 3: VImpTotal = "000000000000" & vimporte
        Case 4: VImpTotal = "00000000000" & vimporte
        Case 5: VImpTotal = "0000000000" & vimporte
        Case 6: VImpTotal = "000000000" & vimporte
        Case 7: VImpTotal = "00000000" & vimporte
        Case 8: VImpTotal = "0000000" & vimporte
        Case 9: VImpTotal = "000000" & vimporte
        Case 10: VImpTotal = "00000" & vimporte
        Case 11: VImpTotal = "0000" & vimporte
        Case 12: VImpTotal = "000" & vimporte
        Case 13: VImpTotal = "00" & VImpInternos
        Case 14: VImpTotal = "0" & VImpInternos
        Case 15: VImpTotal = VImpInternos
    End Select
    VLinea = VLinea & VImpTotal
    ' TIPO DE MONEDA
    VCodMoneda = "PES"
    VLinea = VLinea & VCodMoneda
    ' TIPO DE CAMBIO
    VTipoCambio = "0001000000"
    VLinea = VLinea & VTipoCambio
    ' CANTIDAD DE ALICUOTAS
    VCantAlicIVa = CantAlic
    VLinea = VLinea & VCantAlicIVa
    'CODIGO DE OPERACION
    If CantAlic = 2 Then
        VCodOperacion = "N"
    Else
        VCodOperacion = "0"
    End If
    VLinea = VLinea & VCodOperacion
    'CREDITO FISCAL COMPUTABLE
    vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFactProv!IVA))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFactProv!IVA), i, 1)
        If Not DIGITO = "." And Not DIGITO = "," Then
            vimporte = vimporte & DIGITO
        End If
    Next
    vimporte = vimporte & DIGITO
    VTamaño = Len(vimporte)
    Select Case VTamaño
        Case 2: VImpTotal = "0000000000000" & vimporte
        Case 3: VImpTotal = "000000000000" & vimporte
        Case 4: VImpTotal = "00000000000" & vimporte
        Case 5: VImpTotal = "0000000000" & vimporte
        Case 6: VImpTotal = "000000000" & vimporte
        Case 7: VImpTotal = "00000000" & vimporte
        Case 8: VImpTotal = "0000000" & vimporte
        Case 9: VImpTotal = "000000" & vimporte
        Case 10: VImpTotal = "00000" & vimporte
        Case 11: VImpTotal = "0000" & vimporte
        Case 12: VImpTotal = "000" & vimporte
        Case 13: VImpTotal = "00" & vimporte
        Case 14: VImpTotal = "0" & vimporte
        Case 15: VImpTotal = vimporte
    End Select
    VLinea = VLinea & VImpTotal
    ' OTROS TRIBUTOS
    VOtroTib = "000000000000000"
    VLinea = VLinea & VOtroTib
    'FECHA DE PAGO
    VFechaPago = "00000000000                              000000000000000"
    VLinea = VLinea & VFechaPago
    VTamaño = Len(VLinea)
    
    '////GRABA LINEA EN ARCHIVO COMPROBANTE////
    If VTamaño = 325 Then
         Archivo.WriteLine VLinea
    Else
        Archivo.WriteLine VLinea
    End If
    
    'ARCHIVO DE ALICUOTAS
    'BUSCA NETO GRABADO
    If Not Neto21 = 0 Then
        VLinea = ""
        VLinea = VComp & VPtoVta & VNroComp & VCodDoc & VNroDoc
        vimporte = ""
        VTamaño = Len(FormatNumber(Neto21))
        i = 0
        For i = i + 1 To VTamaño + 1
            DIGITO = Mid(FormatNumber(Neto21), i, 1)
            If Not DIGITO = "." And Not DIGITO = "," Then
                vimporte = vimporte & DIGITO
            End If
        Next
        VTamaño = Len(vimporte)
        Select Case VTamaño
            Case 2: VImpTotal = "0000000000000" & vimporte
            Case 3: VImpTotal = "000000000000" & vimporte
            Case 4: VImpTotal = "00000000000" & vimporte
            Case 5: VImpTotal = "0000000000" & vimporte
            Case 6: VImpTotal = "000000000" & vimporte
            Case 7: VImpTotal = "00000000" & vimporte
            Case 8: VImpTotal = "0000000" & vimporte
            Case 9: VImpTotal = "000000" & vimporte
            Case 10: VImpTotal = "00000" & vimporte
            Case 11: VImpTotal = "0000" & vimporte
            Case 12: VImpTotal = "000" & vimporte
            Case 13: VImpTotal = "00" & vimporte
            Case 14: VImpTotal = "0" & vimporte
            Case 15: VImpTotal = vimporte
        End Select
        VLinea = VLinea & VImpTotal
        'ALICUOTA IVA
        VLinea = VLinea & "0005"
        'IMPORTE DE IVA
        vimporte = ""
        IVA = Neto21 * 21 / 100
        VTamaño = Len(FormatNumber(IVA))
        i = 0
        For i = i + 1 To VTamaño + 1
            DIGITO = Mid(FormatNumber(IVA), i, 1)
            If Not DIGITO = "." And Not DIGITO = "," Then
                vimporte = vimporte & DIGITO
            End If
        Next
        VTamaño = Len(vimporte)
        Select Case VTamaño
            Case 2: VImpTotal = "0000000000000" & vimporte
            Case 3: VImpTotal = "000000000000" & vimporte
            Case 4: VImpTotal = "00000000000" & vimporte
            Case 5: VImpTotal = "0000000000" & vimporte
            Case 6: VImpTotal = "000000000" & vimporte
            Case 7: VImpTotal = "00000000" & vimporte
            Case 8: VImpTotal = "0000000" & vimporte
            Case 9: VImpTotal = "000000" & vimporte
            Case 10: VImpTotal = "00000" & vimporte
            Case 11: VImpTotal = "0000" & vimporte
            Case 12: VImpTotal = "000" & vimporte
            Case 13: VImpTotal = "00" & vimporte
            Case 14: VImpTotal = "0" & vimporte
            Case 15: VImpTotal = vimporte
        End Select
        VLinea = VLinea & VImpTotal
        '////GRABA LINEA EN ARCHIVO ALICUOTA////
        VTamaño = Len(VLinea)
        If VTamaño = 84 Then
             ArchivoAlic.WriteLine VLinea
        Else
            ArchivoAlic.WriteLine VLinea
        End If
    End If
        
    If Not Neto105 = 0 Then
        VLinea = ""
        VLinea = VComp & VPtoVta & VNroComp & VCodDoc & VNroDoc
        vimporte = ""
        VTamaño = Len(FormatNumber(Neto105))
        i = 0
        For i = i + 1 To VTamaño + 1
            DIGITO = Mid(FormatNumber(Neto105), i, 1)
            If Not DIGITO = "." And Not DIGITO = "," Then
                vimporte = vimporte & DIGITO
            End If
        Next
        VTamaño = Len(vimporte)
        Select Case VTamaño
            Case 2: VImpTotal = "0000000000000" & vimporte
            Case 3: VImpTotal = "000000000000" & vimporte
            Case 4: VImpTotal = "00000000000" & vimporte
            Case 5: VImpTotal = "0000000000" & vimporte
            Case 6: VImpTotal = "000000000" & vimporte
            Case 7: VImpTotal = "00000000" & vimporte
            Case 8: VImpTotal = "0000000" & vimporte
            Case 9: VImpTotal = "000000" & vimporte
            Case 10: VImpTotal = "00000" & vimporte
            Case 11: VImpTotal = "0000" & vimporte
            Case 12: VImpTotal = "000" & vimporte
            Case 13: VImpTotal = "00" & vimporte
            Case 14: VImpTotal = "0" & vimporte
            Case 15: VImpTotal = vimporte
        End Select
        VLinea = VLinea & VImpTotal
        'ALICUOTA IVA
        VLinea = VLinea & "0004"
        'IMPORTE DE IVA
        vimporte = ""
        IVA = Neto105 * 10.5 / 100
        VTamaño = Len(FormatNumber(IVA))
        i = 0
        For i = i + 1 To VTamaño + 1
            DIGITO = Mid(FormatNumber(IVA), i, 1)
            If Not DIGITO = "." And Not DIGITO = "," Then
                vimporte = vimporte & DIGITO
            End If
        Next
        VTamaño = Len(vimporte)
        Select Case VTamaño
            Case 2: VImpTotal = "0000000000000" & vimporte
            Case 3: VImpTotal = "000000000000" & vimporte
            Case 4: VImpTotal = "00000000000" & vimporte
            Case 5: VImpTotal = "0000000000" & vimporte
            Case 6: VImpTotal = "000000000" & vimporte
            Case 7: VImpTotal = "00000000" & vimporte
            Case 8: VImpTotal = "0000000" & vimporte
            Case 9: VImpTotal = "000000" & vimporte
            Case 10: VImpTotal = "00000" & vimporte
            Case 11: VImpTotal = "0000" & vimporte
            Case 12: VImpTotal = "000" & vimporte
            Case 13: VImpTotal = "00" & vimporte
            Case 14: VImpTotal = "0" & vimporte
            Case 15: VImpTotal = vimporte
        End Select
        VLinea = VLinea & VImpTotal
        '////GRABA LINEA EN ARCHIVO ALICUOTA////
        VTamaño = Len(VLinea)
        If VTamaño = 84 Then
             ArchivoAlic.WriteLine VLinea
        Else
            ArchivoAlic.WriteLine VLinea
        End If
    End If
    If Not Neto27 = 0 Then
        VLinea = ""
        VLinea = VComp & VPtoVta & VNroComp & VCodDoc & VNroDoc
        vimporte = ""
        VTamaño = Len(FormatNumber(Neto27))
        i = 0
        For i = i + 1 To VTamaño + 1
            DIGITO = Mid(FormatNumber(Neto27), i, 1)
            If Not DIGITO = "." And Not DIGITO = "," Then
                vimporte = vimporte & DIGITO
            End If
        Next
        VTamaño = Len(vimporte)
        Select Case VTamaño
            Case 2: VImpTotal = "0000000000000" & vimporte
            Case 3: VImpTotal = "000000000000" & vimporte
            Case 4: VImpTotal = "00000000000" & vimporte
            Case 5: VImpTotal = "0000000000" & vimporte
            Case 6: VImpTotal = "000000000" & vimporte
            Case 7: VImpTotal = "00000000" & vimporte
            Case 8: VImpTotal = "0000000" & vimporte
            Case 9: VImpTotal = "000000" & vimporte
            Case 10: VImpTotal = "00000" & vimporte
            Case 11: VImpTotal = "0000" & vimporte
            Case 12: VImpTotal = "000" & vimporte
            Case 13: VImpTotal = "00" & vimporte
            Case 14: VImpTotal = "0" & vimporte
            Case 15: VImpTotal = vimporte
        End Select
        VLinea = VLinea & VImpTotal
        'ALICUOTA IVA
        VLinea = VLinea & "0006"
        'IMPORTE DE IVA
        vimporte = ""
        IVA = Neto21 * 27 / 100
        VTamaño = Len(FormatNumber(IVA))
        i = 0
        For i = i + 1 To VTamaño + 1
            DIGITO = Mid(FormatNumber(IVA), i, 1)
            If Not DIGITO = "." And Not DIGITO = "," Then
                vimporte = vimporte & DIGITO
            End If
        Next
        VTamaño = Len(vimporte)
        Select Case VTamaño
            Case 2: VImpTotal = "0000000000000" & vimporte
            Case 3: VImpTotal = "000000000000" & vimporte
            Case 4: VImpTotal = "00000000000" & vimporte
            Case 5: VImpTotal = "0000000000" & vimporte
            Case 6: VImpTotal = "000000000" & vimporte
            Case 7: VImpTotal = "00000000" & vimporte
            Case 8: VImpTotal = "0000000" & vimporte
            Case 9: VImpTotal = "000000" & vimporte
            Case 10: VImpTotal = "00000" & vimporte
            Case 11: VImpTotal = "0000" & vimporte
            Case 12: VImpTotal = "000" & vimporte
            Case 13: VImpTotal = "00" & vimporte
            Case 14: VImpTotal = "0" & vimporte
            Case 15: VImpTotal = vimporte
        End Select
        VLinea = VLinea & VImpTotal
        '////GRABA LINEA EN ARCHIVO ALICUOTA////
        VTamaño = Len(VLinea)
        If VTamaño = 84 Then
             ArchivoAlic.WriteLine VLinea
        Else
            ArchivoAlic.WriteLine VLinea
        End If
    End If
    If Not Neto0 = 0 Then
        VLinea = ""
        VLinea = VComp & VPtoVta & VNroComp & VCodDoc & VNroDoc
        vimporte = ""
        VTamaño = Len(FormatNumber(Neto0))
        i = 0
        For i = i + 1 To VTamaño + 1
            DIGITO = Mid(FormatNumber(Neto0), i, 1)
            If Not DIGITO = "." And Not DIGITO = "," Then
                vimporte = vimporte & DIGITO
            End If
        Next
        VTamaño = Len(vimporte)
        Select Case VTamaño
            Case 2: VImpTotal = "0000000000000" & vimporte
            Case 3: VImpTotal = "000000000000" & vimporte
            Case 4: VImpTotal = "00000000000" & vimporte
            Case 5: VImpTotal = "0000000000" & vimporte
            Case 6: VImpTotal = "000000000" & vimporte
            Case 7: VImpTotal = "00000000" & vimporte
            Case 8: VImpTotal = "0000000" & vimporte
            Case 9: VImpTotal = "000000" & vimporte
            Case 10: VImpTotal = "00000" & vimporte
            Case 11: VImpTotal = "0000" & vimporte
            Case 12: VImpTotal = "000" & vimporte
            Case 13: VImpTotal = "00" & vimporte
            Case 14: VImpTotal = "0" & vimporte
            Case 15: VImpTotal = vimporte
        End Select
        VLinea = VLinea & VImpTotal
        'ALICUOTA IVA
        VLinea = VLinea & "0003"
        'IMPORTE DE IVA
        vimporte = ""
        IVA = Neto21 * 0 / 100
        VTamaño = Len(FormatNumber(IVA))
        i = 0
        For i = i + 1 To VTamaño + 1
            DIGITO = Mid(FormatNumber(IVA), i, 1)
            If Not DIGITO = "." And Not DIGITO = "," Then
                vimporte = vimporte & DIGITO
            End If
        Next
        VTamaño = Len(vimporte)
        Select Case VTamaño
            Case 2: VImpTotal = "0000000000000" & vimporte
            Case 3: VImpTotal = "000000000000" & vimporte
            Case 4: VImpTotal = "00000000000" & vimporte
            Case 5: VImpTotal = "0000000000" & vimporte
            Case 6: VImpTotal = "000000000" & vimporte
            Case 7: VImpTotal = "00000000" & vimporte
            Case 8: VImpTotal = "0000000" & vimporte
            Case 9: VImpTotal = "000000" & vimporte
            Case 10: VImpTotal = "00000" & vimporte
            Case 11: VImpTotal = "0000" & vimporte
            Case 12: VImpTotal = "000" & vimporte
            Case 13: VImpTotal = "00" & vimporte
            Case 14: VImpTotal = "0" & vimporte
            Case 15: VImpTotal = vimporte
        End Select
        VLinea = VLinea & VImpTotal
        '////GRABA LINEA EN ARCHIVO ALICUOTA////
        VTamaño = Len(VLinea)
        If VTamaño = 84 Then
             ArchivoAlic.WriteLine VLinea
        Else
            ArchivoAlic.WriteLine VLinea
        End If
    End If
    rsEncabFactProv.MoveNext
    
Loop
Set rsEncabFactProv = Nothing
'liquido productos
Set rsEncabFactProv = db.OpenRecordset("SELECT * FROM EncabLProd WHERE Fecha BETWEEN # " + Format(FDESDE, "mm/dd/yyyy") + " # AND # " + Format(FHASTA, "mm/dd/yyyy") + " #")

'Set rsEncabFactProv = db.OpenRecordset("SELECT * FROM EncabLProd WHERE Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + "")
Do While Not rsEncabFactProv.EOF
    If Not rsEncabFactProv!netoviajes = 0 Then
    VLinea = ""
    'fecha
    Vfecha = Mid(rsEncabFactProv!Fecha, 7, 4) & Mid(rsEncabFactProv!Fecha, 4, 2) & Mid(rsEncabFactProv!Fecha, 1, 2)
    VLinea = Vfecha
    'tipo de comprobante
    VTamaño = Len(rsEncabFactProv!TipoAfip)
    Select Case VTamaño
        Case 1: VComp = "00" & rsEncabFactProv!TipoAfip
        Case 2: VComp = "0" & rsEncabFactProv!TipoAfip
        Case 3: VComp = rsEncabFactProv!TipoAfip
    End Select
    If Len(VComp) = 3 Then
        VLinea = VLinea & VComp
    Else
        MsgBox "Error VComp"
    End If
    'pto de venta
    VTamaño = Len(rsEncabFactProv!PtoVta)
    Select Case VTamaño
        Case 1: VPtoVta = "0000" & rsEncabFactProv!PtoVta
        Case 2: VPtoVta = "000" & rsEncabFactProv!PtoVta
        Case 3: VPtoVta = "00" & rsEncabFactProv!PtoVta
        Case 4: VPtoVta = "0" & rsEncabFactProv!PtoVta
        Case 5: VPtoVta = rsEncabFactProv!PtoVta
    End Select
    If Len(VPtoVta) = 5 Then
        VLinea = VLinea & VPtoVta
    Else
        MsgBox "Error en el PtoVta"
    End If
    'nro de comprobante
    VTamaño = Len(rsEncabFactProv!NroComp)
    Select Case VTamaño
        Case 1: VNroComp = "0000000000000000000" & rsEncabFactProv!NroComp
        Case 2: VNroComp = "000000000000000000" & rsEncabFactProv!NroComp
        Case 3: VNroComp = "00000000000000000" & rsEncabFactProv!NroComp
        Case 4: VNroComp = "0000000000000000" & rsEncabFactProv!NroComp
        Case 5: VNroComp = "000000000000000" & rsEncabFactProv!NroComp
        Case 6: VNroComp = "00000000000000" & rsEncabFactProv!NroComp
        Case 7: VNroComp = "0000000000000" & rsEncabFactProv!NroComp
        Case 8: VNroComp = "000000000000" & rsEncabFactProv!NroComp
        Case 9: VNroComp = "00000000000" & rsEncabFactProv!NroComp
        Case 10: VNroComp = "0000000000" & rsEncabFactProv!NroComp
        Case 11: VNroComp = "000000000" & rsEncabFactProv!NroComp
        Case 12: VNroComp = "00000000" & rsEncabFactProv!NroComp
        Case 13: VNroComp = "0000000" & rsEncabFactProv!NroComp
        Case 14: VNroComp = "000000" & rsEncabFactProv!NroComp
        Case 15: VNroComp = "00000" & rsEncabFactProv!NroComp
        Case 16: VNroComp = "0000" & rsEncabFactProv!NroComp
        Case 17: VNroComp = "000" & rsEncabFactProv!NroComp
        Case 18: VNroComp = "00" & rsEncabFactProv!NroComp
        Case 19: VNroComp = "0" & rsEncabFactProv!NroComp
        Case 20: VNroComp = rsEncabFactProv!NroComp
    End Select
    If Len(VNroComp) = 20 Then
        VLinea = VLinea & VNroComp
    Else
        MsgBox "Error en el Nro de comprobante"
    End If
    '////nro de despacho de importacion
    VNroComp1 = "                "
    VLinea = VLinea & VNroComp1
    'codigo de comprador
    VCodDoc = "80"
    VLinea = VLinea & VCodDoc
    'nro de documento o cuit
    Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFactProv!codflet & "")
    VNroDoc = "000000000" & Mid(rsFleteros!cuit, 1, 2) & Mid(rsFleteros!cuit, 4, 8) & Mid(rsFleteros!cuit, 13, 1)
    If Not Len(VNroDoc) = 20 Then
        MsgBox ("Error")
    End If
    Tamaño = 0
    Tamaño = Len(rsFleteros!DescFlet)
    Select Case Tamaño
        Case 1: VAyN = rsFleteros!DescFlet & "                             "
        Case 2: VAyN = rsFleteros!DescFlet & "                            "
        Case 3: VAyN = rsFleteros!DescFlet & "                           "
        Case 4: VAyN = rsFleteros!DescFlet & "                          "
        Case 5: VAyN = rsFleteros!DescFlet & "                         "
        Case 6: VAyN = rsFleteros!DescFlet & "                        "
        Case 7: VAyN = rsFleteros!DescFlet & "                       "
        Case 8: VAyN = rsFleteros!DescFlet & "                      "
        Case 9: VAyN = rsFleteros!DescFlet & "                     "
        Case 10: VAyN = rsFleteros!DescFlet & "                    "
        Case 11: VAyN = rsFleteros!DescFlet & "                   "
        Case 12: VAyN = rsFleteros!DescFlet & "                  "
        Case 13: VAyN = rsFleteros!DescFlet & "                 "
        Case 14: VAyN = rsFleteros!DescFlet & "                "
        Case 15: VAyN = rsFleteros!DescFlet & "               "
        Case 16: VAyN = rsFleteros!DescFlet & "              "
        Case 17: VAyN = rsFleteros!DescFlet & "             "
        Case 18: VAyN = rsFleteros!DescFlet & "            "
        Case 19: VAyN = rsFleteros!DescFlet & "           "
        Case 20: VAyN = rsFleteros!DescFlet & "          "
        Case 21: VAyN = rsFleteros!DescFlet & "         "
        Case 22: VAyN = rsFleteros!DescFlet & "        "
        Case 23: VAyN = rsFleteros!DescFlet & "       "
        Case 24: VAyN = rsFleteros!DescFlet & "      "
        Case 25: VAyN = rsFleteros!DescFlet & "     "
        Case 26: VAyN = rsFleteros!DescFlet & "    "
        Case 27: VAyN = rsFleteros!DescFlet & "   "
        Case 28: VAyN = rsFleteros!DescFlet & "  "
        Case 29: VAyN = rsFleteros!DescFlet & " "
        Case Is >= 30: VAyN = Mid(rsFleteros!DescFlet, 1, 30)
    End Select
    Set rsFleteros = Nothing
    If Len(VAyN) = 30 Then
        VLinea = VLinea & VNroDoc & VAyN
    Else
        MsgBox "Error"
    End If
    'importe total de la operacion
    vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFactProv!totalviajeS1))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFactProv!totalviajeS1), i, 1)
        If Not DIGITO = "." And Not DIGITO = "," Then
            vimporte = vimporte & DIGITO
        End If
    Next
    vimporte = vimporte & DIGITO
    VTamaño = Len(vimporte)
    Select Case VTamaño
        Case 2: VImpTotal = "0000000000000" & vimporte
        Case 3: VImpTotal = "000000000000" & vimporte
        Case 4: VImpTotal = "00000000000" & vimporte
        Case 5: VImpTotal = "0000000000" & vimporte
        Case 6: VImpTotal = "000000000" & vimporte
        Case 7: VImpTotal = "00000000" & vimporte
        Case 8: VImpTotal = "0000000" & vimporte
        Case 9: VImpTotal = "000000" & vimporte
        Case 10: VImpTotal = "00000" & vimporte
        Case 11: VImpTotal = "0000" & vimporte
        Case 12: VImpTotal = "000" & vimporte
        Case 13: VImpTotal = "00" & vimporte
        Case 14: VImpTotal = "0" & vimporte
        Case 15: VImpTotal = vimporte
    End Select
    VLinea = VLinea & VImpTotal
    ' IMPORTE NO GRABADO
    VNoGrabado = "000000000000000"
    VLinea = VLinea & VNoGrabado
    'PERCEPCIONES A NO CATEGORIZADOS
    VPerc = "000000000000000"
    VLinea = VLinea & VPerc
    'IMPORTE OPERACIONES EXENTAS
    VImpExentas = "000000000000000"
    VLinea = VLinea & VImpExentas
    'PAGOS A CUENTAS
    VImpPagoCta = "000000000000000"
    VLinea = VLinea & VImpPagoCta
    'PERCEPCIONES
    VImpPerIIBB = "000000000000000"
    VLinea = VLinea & VImpPerIIBB
    'IMPUESTO MUNICIPALES
    VImpMuni = "000000000000000"
    VLinea = VLinea & VImpMuni
    ' IMPUESTOS INTERNOS
    VImpInternos = "000000000000000"
    VLinea = VLinea & VImpInternos
    ' TIPO DE MONEDA
    VCodMoneda = "PES"
    VLinea = VLinea & VCodMoneda
    ' TIPO DE CAMBIO
    VTipoCambio = "0001000000"
    VLinea = VLinea & VTipoCambio
    ' CANTIDAD DE ALICUOTAS
    VCantAlicIVa = "1"
    VLinea = VLinea & VCantAlicIVa
    'CODIGO DE OPERACION
    VCodOperacion = "0"
    VLinea = VLinea & VCodOperacion
    'CREDITO FISCAL COMPUTABLE
    vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFactProv!ivaviaje))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFactProv!ivaviaje), i, 1)
        If Not DIGITO = "." And Not DIGITO = "," Then
            vimporte = vimporte & DIGITO
        End If
    Next
    vimporte = vimporte & DIGITO
    VTamaño = Len(vimporte)
    Select Case VTamaño
        Case 2: VImpTotal = "0000000000000" & vimporte
        Case 3: VImpTotal = "000000000000" & vimporte
        Case 4: VImpTotal = "00000000000" & vimporte
        Case 5: VImpTotal = "0000000000" & vimporte
        Case 6: VImpTotal = "000000000" & vimporte
        Case 7: VImpTotal = "00000000" & vimporte
        Case 8: VImpTotal = "0000000" & vimporte
        Case 9: VImpTotal = "000000" & vimporte
        Case 10: VImpTotal = "00000" & vimporte
        Case 11: VImpTotal = "0000" & vimporte
        Case 12: VImpTotal = "000" & vimporte
        Case 13: VImpTotal = "00" & vimporte
        Case 14: VImpTotal = "0" & vimporte
        Case 15: VImpTotal = vimporte
    End Select
    VLinea = VLinea & VImpTotal
    ' OTROS TRIBUTOS
    VOtroTib = "000000000000000"
    VLinea = VLinea & VOtroTib
    'cuit y denominacion corredor
    VFechaPago = "30709381683TransMagg SRL                 "
    VLinea = VLinea & VFechaPago
    'iva comision
    'VIMPORTE = ""
    'VTamaño = Len(FormatNumber(rsEncabFactProv!IVAComis))
   ' i = 0
    'For i = i + 1 To VTamaño + 1
      '  digito = Mid(FormatNumber(rsEncabFactProv!IVAComis), i, 1)
      '  If Not digito = "." And Not digito = "," Then
     '       VIMPORTE = VIMPORTE & digito
    '    End If
   ' Next
   ' VIMPORTE = VIMPORTE & digito
    'VTamaño = Len(VIMPORTE)
   ' Select Case VTamaño
       ' Case 2: VImpTotal = "0000000000000" & VIMPORTE
       ' Case 3: VImpTotal = "000000000000" & VIMPORTE
       ' Case 4: VImpTotal = "00000000000" & VIMPORTE
       ' Case 5: VImpTotal = "0000000000" & VIMPORTE
       ' Case 6: VImpTotal = "000000000" & VIMPORTE
       ' Case 7: VImpTotal = "00000000" & VIMPORTE
       ' Case 8: VImpTotal = "0000000" & VIMPORTE
      '  Case 9: VImpTotal = "000000" & VIMPORTE
       ' Case 10: VImpTotal = "00000" & VIMPORTE
       ' Case 11: VImpTotal = "0000" & VIMPORTE
       ' Case 12: VImpTotal = "000" & VIMPORTE
       ' Case 13: VImpTotal = "00" & VIMPORTE
      '  Case 14: VImpTotal = "0" & VIMPORTE
     '   Case 15: VImpTotal = VIMPORTE
    'End Select
    'VLinea = VLinea & VImpTotal
    
    VLinea = VLinea & "000000000000000"
       
    VTamaño = Len(VLinea)
    
    '////GRABA LINEA EN ARCHIVO COMPROBANTE////
    If VTamaño = 325 Then
         Archivo.WriteLine VLinea
    Else
        Archivo.WriteLine VLinea
    End If
    
    VLinea = ""
    VLinea = VComp & VPtoVta & VNroComp & VCodDoc & VNroDoc
    'BUSCA NETO GRABADO
    vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFactProv!netoviajes))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFactProv!netoviajes), i, 1)
        If Not DIGITO = "." And Not DIGITO = "," Then
            vimporte = vimporte & DIGITO
        End If
    Next
    VTamaño = Len(vimporte)
    Select Case VTamaño
        Case 2: VImpTotal = "0000000000000" & vimporte
        Case 3: VImpTotal = "000000000000" & vimporte
        Case 4: VImpTotal = "00000000000" & vimporte
        Case 5: VImpTotal = "0000000000" & vimporte
        Case 6: VImpTotal = "000000000" & vimporte
        Case 7: VImpTotal = "00000000" & vimporte
        Case 8: VImpTotal = "0000000" & vimporte
        Case 9: VImpTotal = "000000" & vimporte
        Case 10: VImpTotal = "00000" & vimporte
        Case 11: VImpTotal = "0000" & vimporte
        Case 12: VImpTotal = "000" & vimporte
        Case 13: VImpTotal = "00" & vimporte
        Case 14: VImpTotal = "0" & vimporte
        Case 15: VImpTotal = vimporte
    End Select
    VLinea = VLinea & VImpTotal
    'ALICUOTA IVA
    VLinea = VLinea & "0005"
    
    'IMPORTE DE IVA
    vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFactProv!ivaviaje))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFactProv!ivaviaje), i, 1)
        If Not DIGITO = "." And Not DIGITO = "," Then
            vimporte = vimporte & DIGITO
        End If
    Next
    VTamaño = Len(vimporte)
    Select Case VTamaño
        Case 2: VImpTotal = "0000000000000" & vimporte
        Case 3: VImpTotal = "000000000000" & vimporte
        Case 4: VImpTotal = "00000000000" & vimporte
        Case 5: VImpTotal = "0000000000" & vimporte
        Case 6: VImpTotal = "000000000" & vimporte
        Case 7: VImpTotal = "00000000" & vimporte
        Case 8: VImpTotal = "0000000" & vimporte
        Case 9: VImpTotal = "000000" & vimporte
        Case 10: VImpTotal = "00000" & vimporte
        Case 11: VImpTotal = "0000" & vimporte
        Case 12: VImpTotal = "000" & vimporte
        Case 13: VImpTotal = "00" & vimporte
        Case 14: VImpTotal = "0" & vimporte
        Case 15: VImpTotal = vimporte
    End Select
    VLinea = VLinea & VImpTotal
    '////GRABA LINEA EN ARCHIVO ALICUOTA////
    VTamaño = Len(VLinea)
    If VTamaño = 84 Then
         ArchivoAlic.WriteLine VLinea
    Else
        
        ArchivoAlic.WriteLine VLinea
    End If
    Else
        MsgBox "ANULADO"
    End If
    rsEncabFactProv.MoveNext
    
Loop
Set rsEncabFactProv = Nothing

End Sub

Private Sub Form_Load()
FDESDE.Mask = ""
FDESDE.Text = ""
FDESDE.Mask = "##/##/####"
FHASTA.Mask = ""
FHASTA.Text = ""
FHASTA.Mask = "##/##/####"
Option1(0).Value = True
Option1(1).Value = False
End Sub

Private Sub Option1_Click(Index As Integer)
Select Case Index
Case 0:
    Option1(0).Value = True
    Option1(1).Value = False
Case 1:
    Option1(0).Value = False
    Option1(1).Value = True
End Select
End Sub

