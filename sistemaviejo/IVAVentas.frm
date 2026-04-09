VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Begin VB.Form IVAVentas 
   BackColor       =   &H80000007&
   Caption         =   "IVA Ventas"
   ClientHeight    =   4995
   ClientLeft      =   60
   ClientTop       =   390
   ClientWidth     =   5565
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   4995
   ScaleWidth      =   5565
   Begin VB.Frame Frame1 
      BackColor       =   &H80000007&
      Caption         =   "Opciones del Listado"
      ForeColor       =   &H0080C0FF&
      Height          =   975
      Left            =   240
      TabIndex        =   4
      Top             =   720
      Width           =   4935
      Begin VB.CheckBox Check2 
         BackColor       =   &H80000006&
         Caption         =   "Solo Comisiones"
         ForeColor       =   &H00C0E0FF&
         Height          =   255
         Left            =   2640
         TabIndex        =   9
         Top             =   600
         Width           =   1935
      End
      Begin VB.CheckBox Check1 
         BackColor       =   &H80000006&
         Caption         =   "Todos los Comprobantes"
         ForeColor       =   &H00C0E0FF&
         Height          =   255
         Left            =   480
         TabIndex        =   8
         Top             =   600
         Width           =   2655
      End
      Begin VB.OptionButton Option1 
         BackColor       =   &H80000006&
         Caption         =   "Total por Comprobantes"
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   1
         Left            =   2640
         TabIndex        =   7
         Top             =   240
         Width           =   2175
      End
      Begin VB.OptionButton Option1 
         BackColor       =   &H80000006&
         Caption         =   "Analitico"
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   0
         Left            =   480
         TabIndex        =   6
         Top             =   240
         Width           =   1335
      End
   End
   Begin MSMask.MaskEdBox FHasta 
      Height          =   285
      Left            =   3960
      TabIndex        =   1
      Top             =   240
      Width           =   1215
      _ExtentX        =   2143
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin MSMask.MaskEdBox FDesde 
      Height          =   285
      Left            =   1440
      TabIndex        =   0
      Top             =   240
      Width           =   1215
      _ExtentX        =   2143
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin KewlButtonz.KewlButtons Consultar 
      Height          =   495
      Left            =   360
      TabIndex        =   5
      Top             =   1920
      Width           =   4695
      _ExtentX        =   8281
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Consultar"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8,25
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
      MICON           =   "IVAVentas.frx":0000
      PICN            =   "IVAVentas.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Exportar 
      Height          =   495
      Left            =   360
      TabIndex        =   10
      Top             =   2520
      Width           =   4695
      _ExtentX        =   8281
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Exportar Citi"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8,25
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
      MICON           =   "IVAVentas.frx":562E
      PICN            =   "IVAVentas.frx":564A
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons LProdVsFact 
      Height          =   495
      Left            =   360
      TabIndex        =   11
      Top             =   3120
      Width           =   4695
      _ExtentX        =   8281
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Liquidos Prod Vs Facturas"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8,25
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
      MICON           =   "IVAVentas.frx":AC5C
      PICN            =   "IVAVentas.frx":AC78
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Comisiones 
      Height          =   495
      Left            =   360
      TabIndex        =   12
      Top             =   3720
      Width           =   4695
      _ExtentX        =   8281
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Comisiones Cobradas"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8,25
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
      MICON           =   "IVAVentas.frx":1028A
      PICN            =   "IVAVentas.frx":102A6
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons LibroIVA 
      Height          =   495
      Left            =   360
      TabIndex        =   13
      Top             =   4320
      Width           =   4695
      _ExtentX        =   8281
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Libro IVA Digital"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8,25
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
      MICON           =   "IVAVentas.frx":158B8
      PICN            =   "IVAVentas.frx":158D4
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
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
      Left            =   2760
      TabIndex        =   3
      Top             =   240
      Width           =   1455
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
      Left            =   0
      TabIndex        =   2
      Top             =   240
      Width           =   1455
   End
End
Attribute VB_Name = "IVAVentas"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub Check1_Click()
If Check1.Value = 0 Then
    Check2.Value = 1
Else
    Check2.Value = 0
End If
End Sub

Private Sub Check2_Click()
If Check2.Value = 0 Then
    Check1.Value = 1
Else
    Check1.Value = 0
End If

End Sub

Private Sub Comisiones_Click()

If IsDate(FDesde) = False Or IsDate(FHasta) = False Then
    MsgBox "Fecha Incorrecta", vbInformation
    Exit Sub
End If
If Format(FHasta, "dd/mm/yyyy") < Format(FDesde, "dd/mm/yyyy") Then
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

'graba inf del periodo
    With TrsConsultas
        .AddNew
        .Fields("FDede") = FDesde
        .Fields("FHasta") = FHasta
        .Update
    End With
    
'busca liquidos productos
    Set rsEncabFactProv = db.OpenRecordset("SELECT * FROM EncabLProd WHERE Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " # ORDER BY Fecha")
    
    Do While Not rsEncabFactProv.EOF
        If rsEncabFactProv!TotalViajes = 0 Then
            With TrsIVAVentas
            .AddNew
            .Fields("Fecha") = rsEncabFactProv!Fecha
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
            .Update
            End With
        Else
            With TrsIVAVentas
           
            Set rsDet_LP = db.OpenRecordset("Select * From DetViajesLP Where NroComp = " & rsEncabFactProv!NroComp & "")
            Do While Not rsDet_LP.EOF
                 .AddNew
                .Fields("Fecha") = rsEncabFactProv!Fecha
                .Fields("CodProv") = rsEncabFactProv!CodFlet
                'If rsencabfactprovProv!CodComp = 1 Then
                Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFactProv!CodFlet & "")
                .Fields("DescProv") = rsFleteros!DescFlet
                .Fields("CUIT") = rsFleteros!cuit
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
                    .Fields("Neto") = FormatNumber(rsEncabFactProv!netocomis * -1)
                    .Fields("Exento") = "0.00"
                    .Fields("IVA") = FormatNumber(rsEncabFactProv!IVAComis * -1)
                    .Fields("Total") = FormatNumber(rsEncabFactProv!totalcomis * -1)
                Else
                ' .Fields("Neto") = FormatNumber(rsEncabFactProv!TotalViajes)
                ' .Fields("Exento") = "0.00"
                ' .Fields("IVA") = FormatNumber((rsEncabFactProv!TotalViajes * 21) / 100)
                ' .Fields("Total") = FormatNumber(rsEncabFactProv!TotalViajes * 1.21)
                vcomis = FormatNumber(rsDet_LP!sUBTOTAL * rsFleteros!Comision) / 100
                vivacomis = vcomis * 21 / 100
                vtotalcomis = vcomis + vivacomis
            
                    .Fields("Neto") = vcomis
                    .Fields("Exento") = "0.00"
                    .Fields("IVA") = FormatNumber(vivacomis)
                    .Fields("Total") = FormatNumber(vtotalcomis)
                    .Fields("CodProvincia") = rsDet_LP!Provincia
                End If
                 .Update
                rsDet_LP.MoveNext
                
            Loop
            End With
        End If
       
        rsEncabFactProv.MoveNext
    
    Loop
     Dim frmRep As New InfComisiones
        frmRep.Show vbModal

End Sub

Private Sub Consultar_Click()
Dim VAlicuota As Double
Dim VTotalExento As Double
Dim VTotalIVA As Double
Dim VImporte1 As Double
Dim ImpIVA As Double
If IsDate(FDesde) = False Or IsDate(FHasta) = False Then
    MsgBox "Fecha Incorrecta", vbInformation
    Exit Sub
End If
If Format(FHasta, "dd/mm/yyyy") < Format(FDesde, "dd/mm/yyyy") Then
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
        .Fields("FDede") = FDesde
        .Fields("FHasta") = FHasta
        .Update
    End With
    If Check1.Value = 1 Then
        Set rsEncabFact = db.OpenRecordset("SELECT * FROM EncabFact WHERE Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " # ORDER BY Fecha")
        With TrsIVAVentas
            Do While Not rsEncabFact.EOF
                .AddNew
                .Fields("Fecha") = rsEncabFact!Fecha
                If rsEncabFact!Codigo = 99999 Then
                    .Fields("DescProv") = "ANULADO"
                    .Fields("PtoVta") = "0001"
                    Tamaño = Len(rsEncabFact!NroFact)
                    Select Case Tamaño
                        Case 1: VNro = "0000000" & rsEncabFact!NroFact
                        Case 2: VNro = "000000" & rsEncabFact!NroFact
                        Case 3: VNro = "00000" & rsEncabFact!NroFact
                        Case 4: VNro = "0000" & rsEncabFact!NroFact
                        Case 5: VNro = "000" & rsEncabFact!NroFact
                        Case 6: VNro = "00" & rsEncabFact!NroFact
                        Case 7: VNro = "0" & rsEncabFact!NroFact
                        Case 8: VNro = rsEncabFact!NroFact
                    End Select
                    .Fields("NroFact") = VNro
                    .Fields("Neto") = "0.00"
                    .Fields("Exento") = "0.00"
                    .Fields("IVA") = "0.00"
                    .Fields("Total") = "0.00"
                Else
                    .Fields("CodProv") = rsEncabFact!Codigo
                    If rsEncabFact!TipoFact = 2 Or rsEncabFact!TipoFact = 5 Then
                        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!Codigo & "")
                        .Fields("DescProv") = rsFleteros!DescFlet
                        .Fields("CUIT") = rsFleteros!cuit
                        Set rsFleteros = Nothing
                    Else
                        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!Codigo & "")
                        .Fields("DescProv") = rsEmpresas!DescEmpresas
                        .Fields("CUIT") = rsEmpresas!cuit
                        Set rsEmpresas = Nothing
                    End If
                    Select Case rsEncabFact!TipoFact
                        Case 1: .Fields("Comp") = "FACT"
                        Case 3: .Fields("Comp") = "NC"
                        Case 2: .Fields("Comp") = "ND"
                    End Select
                    .Fields("PtoVta") = "0001"
                    Tamaño = Len(rsEncabFact!NroFact)
                    Select Case Tamaño
                        Case 1: VNro = "0000000" & rsEncabFact!NroFact
                        Case 2: VNro = "000000" & rsEncabFact!NroFact
                        Case 3: VNro = "00000" & rsEncabFact!NroFact
                        Case 4: VNro = "0000" & rsEncabFact!NroFact
                        Case 5: VNro = "000" & rsEncabFact!NroFact
                        Case 6: VNro = "00" & rsEncabFact!NroFact
                        Case 7: VNro = "0" & rsEncabFact!NroFact
                        Case 8: VNro = rsEncabFact!NroFact
                    End Select
                    .Fields("NroFact") = VNro
                    If rsEncabFact!TipoFact = 3 Then
                        .Fields("Neto") = FormatNumber(rsEncabFact!TNeto * -1)
                        .Fields("Exento") = "0.00"
                        .Fields("IVA") = FormatNumber(rsEncabFact!TIVA * -1)
                        .Fields("Total") = FormatNumber(rsEncabFact!TGral * -1)
                    Else
                        .Fields("Neto") = FormatNumber(rsEncabFact!TNeto)
                        .Fields("Exento") = "0.00"
                        .Fields("IVA") = FormatNumber(rsEncabFact!TIVA)
                        .Fields("Total") = FormatNumber(rsEncabFact!TGral)
                    End If
                End If
                .Update
                rsEncabFact.MoveNext
            Loop
        End With
        
        Set rsEncabFact = db.OpenRecordset("SELECT * FROM EncabFE WHERE FechaFE BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " # ORDER BY FechaFE")
        With TrsIVAVentas
            Do While Not rsEncabFact.EOF
                .AddNew
                .Fields("Fecha") = rsEncabFact!FechaFE
                If rsEncabFact!CodClie = 99999 Then
                    .Fields("DescProv") = "ANULADO"
                    .Fields("PtoVta") = "0003"
                    Tamaño = Len(rsEncabFact!NroFE)
                    Select Case Tamaño
                        Case 1: VNro = "0000000" & rsEncabFact!NroFE
                        Case 2: VNro = "000000" & rsEncabFact!NroFE
                        Case 3: VNro = "00000" & rsEncabFact!NroFE
                        Case 4: VNro = "0000" & rsEncabFact!NroFE
                        Case 5: VNro = "000" & rsEncabFact!NroFE
                        Case 6: VNro = "00" & rsEncabFact!NroFE
                        Case 7: VNro = "0" & rsEncabFact!NroFE
                        Case 8: VNro = rsEncabFact!NroFE
                    End Select
                    .Fields("NroFact") = VNro
                    .Fields("Neto") = "0.00"
                    .Fields("Exento") = "0.00"
                    .Fields("IVA") = "0.00"
                    .Fields("Total") = "0.00"
                Else
                    .Fields("CodProv") = rsEncabFact!CodClie
                    If rsEncabFact!Emp_Flet = 1 Then
                        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!CodClie & "")
                        .Fields("DescProv") = rsFleteros!DescFlet
                        .Fields("CUIT") = rsFleteros!cuit
                        Set rsFleteros = Nothing
                    Else
                        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
                            .Fields("DescProv") = rsEmpresas!DescEmpresas
                            .Fields("CUIT") = rsEmpresas!cuit
                            Set rsEmpresas = Nothing
                    
                    End If
                    Select Case rsEncabFact!TipoAfip
                        Case 1: .Fields("Comp") = "FACT"
                        Case 3: .Fields("Comp") = "NC"
                        Case 2: .Fields("Comp") = "ND"
                        Case 60: .Fields("Comp") = "LProd"
                    End Select
                    Tamaño = Len(rsEncabFact!PtoVtaFE)
                    Select Case Tamaño
                        Case 1: VNro = "000" & rsEncabFact!PtoVtaFE
                        Case 2: VNro = "00" & rsEncabFact!PtoVtaFE
                        Case 3: VNro = "0" & rsEncabFact!PtoVtaFE
                        Case 4: VNro = rsEncabFact!PtoVtaFE
                    End Select
                    .Fields("PtoVta") = VNro
                    Tamaño = Len(rsEncabFact!NroFE)
                    Select Case Tamaño
                        Case 1: VNro = "0000000" & rsEncabFact!NroFE
                        Case 2: VNro = "000000" & rsEncabFact!NroFE
                        Case 3: VNro = "00000" & rsEncabFact!NroFE
                        Case 4: VNro = "0000" & rsEncabFact!NroFE
                        Case 5: VNro = "000" & rsEncabFact!NroFE
                        Case 6: VNro = "00" & rsEncabFact!NroFE
                        Case 7: VNro = "0" & rsEncabFact!NroFE
                        Case 8: VNro = rsEncabFact!NroFE
                    End Select
                    .Fields("NroFact") = VNro
                    If rsEncabFact!TipoSistema = 203 Or rsEncabFact!TipoSistema = 201 Then
                        Set rsDetFact = db.OpenRecordset("Select * From DetFe Where NroFact = " & rsEncabFact!NroFE & " AND TipoComp = " & rsEncabFact!TipoSistema & " AND PtoVta = " & rsEncabFact!PtoVtaFE & " Order by Alicuota")
                    Else
                        Set rsDetFact = db.OpenRecordset("Select * From DetFe Where NroFact = " & rsEncabFact!NroFE & " AND TipoComp = " & rsEncabFact!TipoAfip & " AND PtoVta = " & rsEncabFact!PtoVtaFE & " Order by Alicuota")
                    End If
                        Do While Not rsDetFact.EOF
                            If rsDetFact!Alicuota = "0" Then
                                VTotalExento = VTotalExento + rsDetFact!STotal
                            Else
                                VTotalIVA = VTotalIVA + rsDetFact!STotal
                            End If
                            rsDetFact.MoveNext
                        Loop
                        If Not VTotalIVA = 0 Then
                            VTotalIVA = VTotalIVA - VTotalExento
                       
                        End If
                    If rsEncabFact!TipoAfip = 3 Then
                        .Fields("Neto") = FormatNumber(VTotalIVA * -1)
                        .Fields("Exento") = FormatNumber(VTotalExento * -1)
                        .Fields("IVA") = FormatNumber(rsEncabFact!TotalIVAFE * -1)
                        .Fields("Total") = FormatNumber(rsEncabFact!totalgralfe * -1)
                        VTotalExento = 0
                        VTotalIVA = 0
                    Else
                        .Fields("Neto") = FormatNumber(VTotalIVA)
                        .Fields("Exento") = FormatNumber(VTotalExento)
                        .Fields("IVA") = FormatNumber(rsEncabFact!TotalIVAFE)
                        .Fields("Total") = FormatNumber(rsEncabFact!totalgralfe)
                        VTotalExento = 0
                        VTotalIVA = 0
                    End If
                End If
                .Update
                rsEncabFact.MoveNext
            Loop
        End With
        Set rsEncabFactCta = db.OpenRecordset("SELECT * FROM EncabFactCta WHERE Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " # ORDER BY Fecha")
        With TrsIVAVentas
            Do While Not rsEncabFactCta.EOF
                .AddNew
                .Fields("Fecha") = rsEncabFactCta!Fecha
                If rsEncabFactCta!Codigo = 99999 Then
                    .Fields("DescProv") = "ANULADO"
                    .Fields("PtoVta") = "0001"
                    Tamaño = Len(rsEncabFactCta!NroFact)
                    Select Case Tamaño
                        Case 1: VNro = "0000000" & rsEncabFactCta!NroFact
                        Case 2: VNro = "000000" & rsEncabFactCta!NroFact
                        Case 3: VNro = "00000" & rsEncabFactCta!NroFact
                        Case 4: VNro = "0000" & rsEncabFactCta!NroFact
                        Case 5: VNro = "000" & rsEncabFactCta!NroFact
                        Case 6: VNro = "00" & rsEncabFactCta!NroFact
                        Case 7: VNro = "0" & rsEncabFactCta!NroFact
                        Case 8: VNro = rsEncabFactCta!NroFact
                    End Select
                    .Fields("NroFact") = VNro
                    .Fields("Neto") = "0.00"
                    .Fields("Exento") = "0.00"
                    .Fields("IVA") = "0.00"
                    .Fields("Total") = "0.00"
                Else
                    .Fields("CodProv") = rsEncabFactCta!Codigo
                    If rsEncabFactCta!TipoFact = 2 Then
                        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!Codigo & "")
                        .Fields("DescProv") = rsFleteros!DescFlet
                        .Fields("CUIT") = rsFleteros!cuit
                        Set rsFleteros = Nothing
                    Else
                        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFactCta!Codigo & "")
                        .Fields("DescProv") = rsEmpresas!DescEmpresas
                        .Fields("CUIT") = rsEmpresas!cuit
                        Set rsEmpresas = Nothing
                    End If
                    Select Case rsEncabFactCta!TipoFact
                        Case 1, 2: .Fields("Comp") = "FACT"
                        Case 3: .Fields("Comp") = "Fact Orden"
                        Case 4: .Fields("Comp") = "NC Orden"
                    End Select
                    .Fields("PtoVta") = "0001"
                    Tamaño = Len(rsEncabFactCta!NroFact)
                    Select Case Tamaño
                        Case 1: VNro = "0000000" & rsEncabFactCta!NroFact
                        Case 2: VNro = "000000" & rsEncabFactCta!NroFact
                        Case 3: VNro = "00000" & rsEncabFactCta!NroFact
                        Case 4: VNro = "0000" & rsEncabFactCta!NroFact
                        Case 5: VNro = "000" & rsEncabFactCta!NroFact
                        Case 6: VNro = "00" & rsEncabFactCta!NroFact
                        Case 7: VNro = "0" & rsEncabFactCta!NroFact
                        Case 8: VNro = rsEncabFactCta!NroFact
                    End Select
                    .Fields("NroFact") = VNro
                    If rsEncabFactCta!TipoFact = 4 Then
                        .Fields("Neto") = FormatNumber(rsEncabFactCta!TNeto * -1)
                        .Fields("Exento") = "0.00"
                        .Fields("IVA") = FormatNumber(rsEncabFactCta!TIVA * -1)
                        .Fields("Total") = FormatNumber(rsEncabFactCta!TGral * -1)
                    Else
                        .Fields("Neto") = FormatNumber(rsEncabFactCta!TNeto)
                        .Fields("Exento") = "0.00"
                        .Fields("IVA") = FormatNumber(rsEncabFactCta!TIVA)
                        .Fields("Total") = FormatNumber(rsEncabFactCta!TGral)
                    End If
                End If
                .Update
                rsEncabFactCta.MoveNext
            Loop
        End With
        'liquido producto anulados
        Set rsEncabFactCta = db.OpenRecordset("SELECT * FROM EncabLProd WHERE Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " # and NetoViajes = 0 ORDER BY Fecha")
        With TrsIVAVentas
            Do While Not rsEncabFactCta.EOF
                .AddNew
                .Fields("Fecha") = rsEncabFactCta!Fecha
                If rsEncabFactCta!CodFlet = 99999 Then
                    .Fields("DescProv") = "ANULADO"
                    .Fields("PtoVta") = "0001"
                     Tamaño = Len(rsEncabFactCta!NroFact)
                    Select Case Tamaño
                        Case 1: VNro = "0000000" & rsEncabFactCta!NroFact
                        Case 2: VNro = "000000" & rsEncabFactCta!NroFact
                        Case 3: VNro = "00000" & rsEncabFactCta!NroFact
                        Case 4: VNro = "0000" & rsEncabFactCta!NroFact
                        Case 5: VNro = "000" & rsEncabFactCta!NroFact
                        Case 6: VNro = "00" & rsEncabFactCta!NroFact
                        Case 7: VNro = "0" & rsEncabFactCta!NroFact
                        Case 8: VNro = rsEncabFactCta!NroFact
                    End Select
                    .Fields("NroFact") = VNro
                    .Fields("Neto") = "0.00"
                    .Fields("Exento") = "0.00"
                    .Fields("IVA") = "0.00"
                    .Fields("Total") = "0.00"
                Else
                    .Fields("CodProv") = rsEncabFactCta!CodFlet
           
                        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFactCta!CodFlet & "")
                        .Fields("DescProv") = rsFleteros!DescFlet
                        .Fields("CUIT") = rsFleteros!cuit
                        Set rsFleteros = Nothing
                        .Fields("Comp") = "LiqProd"
                        .Fields("PtoVta") = "0004"
                    Tamaño = Len(rsEncabFactCta!NroComp)
                    Select Case Tamaño
                        Case 1: VNro = "0000000" & rsEncabFactCta!NroComp
                        Case 2: VNro = "000000" & rsEncabFactCta!NroComp
                        Case 3: VNro = "00000" & rsEncabFactCta!NroComp
                        Case 4: VNro = "0000" & rsEncabFactCta!NroComp
                        Case 5: VNro = "000" & rsEncabFactCta!NroComp
                        Case 6: VNro = "00" & rsEncabFactCta!NroComp
                        Case 7: VNro = "0" & rsEncabFactCta!NroComp
                        Case 8: VNro = rsEncabFactCta!NroComp
                    End Select
                    .Fields("NroFact") = VNro
                    .Fields("Neto") = FormatNumber(rsEncabFactCta!netocomis)
                        .Fields("Exento") = "0.00"
                        .Fields("IVA") = FormatNumber(rsEncabFactCta!IVAComis)
                        .Fields("Total") = FormatNumber(rsEncabFactCta!totalcomis)
                End If
             .Update
                rsEncabFactCta.MoveNext
            Loop
        End With
        Dim frmRep As New InfIVAVentas
        frmRep.Show vbModal
    End If
        
Else
    'informe de totales por comprobantes y alicuotas
      With TrsConsultas
        .AddNew
        .Fields("FDede") = FDesde
        .Fields("FHasta") = FHasta
        .Update
    End With
        Dim VTotalNeto As Double, VDif As Double
        Set TrsIVAVentas = dbTemp.OpenRecordset("IVAxComp")
        Do While Not TrsIVAVentas.EOF
            TrsIVAVentas.Delete
            TrsIVAVentas.MoveNext
        Loop
        Set rsEncabFact = db.OpenRecordset("SELECT * FROM EncabFE WHERE FechaFE BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " #")
        With TrsIVAVentas
        Do While Not rsEncabFact.EOF
            If rsEncabFact!TipoSistema = 203 Then
                Set rsDetFact = db.OpenRecordset("Select * From DetFe Where NroFact = " & rsEncabFact!NroFE & " and TipoComp = " & rsEncabFact!TipoSistema & "  AND PtoVta = " & rsEncabFact!PtoVtaFE & " Order By Alicuota")
            Else
                Set rsDetFact = db.OpenRecordset("Select * From DetFe Where NroFact = " & rsEncabFact!NroFE & " and TipoComp = " & rsEncabFact!TipoAfip & " AND PtoVta = " & rsEncabFact!PtoVtaFE & " Order By Alicuota")
            End If
            Do While Not rsDetFact.EOF
                .AddNew
                .Fields("CodComp") = rsEncabFact!TipoSistema
                Set rsComprobantes = db.OpenRecordset("Select * From Comprobantes Where CodComp = " & rsEncabFact!TipoSistema & "")
                .Fields("DescComp") = rsComprobantes!DescComp
                If Not rsEncabFact!TipoSistema = 17 And Not rsEncabFact!TipoSistema = 203 Then
                    .Fields("Neto") = rsDetFact!STotal
                    .Fields("IVA") = rsDetFact!STotal * rsDetFact!Alicuota / 100
                    
                Else
                    .Fields("Neto") = rsDetFact!STotal * -1
                    .Fields("IVA") = (rsDetFact!STotal * -1) * rsDetFact!Alicuota / 100
                End If
                If rsDetFact!Alicuota = "" Then
                    MsgBox "Alicuta vacia: " & rsEncabFact!NroFE
                Else
                
                    .Fields("Alicuota") = rsDetFact!Alicuota
                End If
                .Update
                VTotalNeto = VTotalNeto + rsDetFact!STotal
                rsDetFact.MoveNext
            Loop
            If Not FormatNumber(VTotalNeto) = FormatNumber(rsEncabFact!TotalNetofe) Then
                MsgBox "Error en factura Nro: " & rsEncabFact!NroFE
                VDif = FormatNumber(rsEncabFact!TotalNetofe) - FormatNumber(VTotalNeto)
                .AddNew
                .Fields("CodComp") = rsEncabFact!TipoSistema
                Set rsComprobantes = db.OpenRecordset("Select * From Comprobantes Where CodComp = " & rsEncabFact!TipoSistema & "")
                .Fields("DescComp") = rsComprobantes!DescComp
                If VDif > 0 Then
                    If Not rsEncabFact!TipoSistema = 17 Then
                        .Fields("Neto") = VDif
                        .Fields("IVA") = VDif * 21 / 100
                    Else
                        .Fields("Neto") = VDif * -1
                        .Fields("IVA") = (VDif * -1) * 21 / 100
                    End If
                Else
                    If Not rsEncabFact!TipoSistema = 17 Then
                        .Fields("Neto") = VDif * -1
                    Else
                        .Fields("Neto") = VDif
                    End If
                End If
                .Fields("Alicuota") = 21
                .Update
            End If
            rsEncabFact.MoveNext
            VTotalNeto = 0
        Loop
        End With
        'facturas liquido productos anulados
        Set rsEncabFact = db.OpenRecordset("SELECT * FROM EncabLprod WHERE Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " #")
        With TrsIVAVentas
        Do While Not rsEncabFact.EOF
            If rsEncabFact!totalviajeS1 = 0 Then
                .AddNew
                .Fields("CodComp") = 60
                Set rsComprobantes = db.OpenRecordset("Select * From Comprobantes Where CodComp = 60")
                .Fields("DescComp") = rsComprobantes!DescComp
                .Fields("Neto") = rsEncabFact!netocomis
                .Fields("Alicuota") = 21
                .Fields("IVA") = rsEncabFact!IVAComis
                .Update
            End If
                 rsEncabFact.MoveNext
        Loop
        End With
        Dim frmRep1 As New InfIVAxComp
        frmRep1.Show vbModal

End If
End Sub

Private Sub Exportar_Click()
Dim Vfecha, VComp, VPtoVta, VNroComp, VCodDoc, VNroDoc, VAyN, VImpTotal, VNoGrabado As String
Dim VPerc, VImpExentas, VImpPagoCta, VImpPerIIBB, VImpMuni, VImpInternos, VCodMoneda, VTipoCambio As String
Dim VCantAlicIVa, VCodOperacion, VOtroTib, VFechaPago As String
Dim VLinea, VLinea1 As String
Dim VTamaño As Integer
Dim obj_FSO As Object
Dim Archivo As Object
Dim ArchivoAlic As Object
Dim NombreArch As String
Set obj_FSO = CreateObject("Scripting.FileSystemObject")
  
'Creamos un archivo con el método CreateTextFile
NombreArch = Mid(FDesde, 7, 4) & Mid(FDesde, 4, 2)
NombreArch = "\citi\ComprobantesVentas_" & NombreArch & ".txt"
Set Archivo = obj_FSO.CreateTextFile(App.Path + NombreArch, True)
NombreArch = Mid(FDesde, 7, 4) & Mid(FDesde, 4, 2)
NombreArch = "\citi\AlicVentas_" & NombreArch & ".txt"
Set ArchivoAlic = obj_FSO.CreateTextFile(App.Path + NombreArch, True)
'FACTURAS ELECTRONICAS

Set rsEncabFact = db.OpenRecordset("SELECT * FROM EncabFE WHERE FechaFE BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " #")
Do While Not rsEncabFact.EOF
    VLinea = ""
    'fecha
    Vfecha = Mid(rsEncabFact!FechaFE, 7, 4) & Mid(rsEncabFact!FechaFE, 4, 2) & Mid(rsEncabFact!FechaFE, 1, 2)
    VLinea = Vfecha
    'tipo de comprobante
    VTamaño = Len(rsEncabFact!TipoAfip)
    Select Case VTamaño
        Case 1: VComp = "00" & rsEncabFact!TipoAfip
        Case 2: VComp = "0" & rsEncabFact!TipoAfip
        Case 3: VComp = rsEncabFact!TipoAfip
    End Select
    If Len(VComp) = 3 Then
        VLinea = VLinea & VComp
    Else
        MsgBox "Error VComp"
    End If
    'pto de venta
    VTamaño = Len(rsEncabFact!PtoVtaFE)
    Select Case VTamaño
        Case 1: VPtoVta = "0000" & rsEncabFact!PtoVtaFE
        Case 2: VPtoVta = "000" & rsEncabFact!PtoVtaFE
        Case 3: VPtoVta = "00" & rsEncabFact!PtoVtaFE
        Case 4: VPtoVta = "0" & rsEncabFact!PtoVtaFE
        Case 5: VPtoVta = rsEncabFact!PtoVtaFE
    End Select
    If Len(VPtoVta) = 5 Then
        VLinea = VLinea & VPtoVta
    Else
        MsgBox "Error en el PtoVta"
    End If
    'nro de comprobante
    VTamaño = Len(rsEncabFact!NroFE)
    Select Case VTamaño
        Case 1: VNroComp = "0000000000000000000" & rsEncabFact!NroFE
        Case 2: VNroComp = "000000000000000000" & rsEncabFact!NroFE
        Case 3: VNroComp = "00000000000000000" & rsEncabFact!NroFE
        Case 4: VNroComp = "0000000000000000" & rsEncabFact!NroFE
        Case 5: VNroComp = "000000000000000" & rsEncabFact!NroFE
        Case 6: VNroComp = "00000000000000" & rsEncabFact!NroFE
        Case 7: VNroComp = "0000000000000" & rsEncabFact!NroFE
        Case 8: VNroComp = "000000000000" & rsEncabFact!NroFE
        Case 9: VNroComp = "00000000000" & rsEncabFact!NroFE
        Case 10: VNroComp = "0000000000" & rsEncabFact!NroFE
        Case 11: VNroComp = "000000000" & rsEncabFact!NroFE
        Case 12: VNroComp = "00000000" & rsEncabFact!NroFE
        Case 13: VNroComp = "0000000" & rsEncabFact!NroFE
        Case 14: VNroComp = "000000" & rsEncabFact!NroFE
        Case 15: VNroComp = "00000" & rsEncabFact!NroFE
        Case 16: VNroComp = "0000" & rsEncabFact!NroFE
        Case 17: VNroComp = "000" & rsEncabFact!NroFE
        Case 18: VNroComp = "00" & rsEncabFact!NroFE
        Case 19: VNroComp = "0" & rsEncabFact!NroFE
        Case 20: VNroComp = rsEncabFact!NroFE
    End Select
    If Len(VNroComp) = 20 Then
        VLinea = VLinea & VNroComp
    Else
        MsgBox "Error en el Nro de comprobante"
    End If
    'nro de comprobante hasta
    Select Case VTamaño
        Case 1: VNroComp = "0000000000000000000" & rsEncabFact!NroFE
        Case 2: VNroComp = "000000000000000000" & rsEncabFact!NroFE
        Case 3: VNroComp = "00000000000000000" & rsEncabFact!NroFE
        Case 4: VNroComp = "0000000000000000" & rsEncabFact!NroFE
        Case 5: VNroComp = "000000000000000" & rsEncabFact!NroFE
        Case 6: VNroComp = "00000000000000" & rsEncabFact!NroFE
        Case 7: VNroComp = "0000000000000" & rsEncabFact!NroFE
        Case 8: VNroComp = "000000000000" & rsEncabFact!NroFE
        Case 9: VNroComp = "00000000000" & rsEncabFact!NroFE
        Case 10: VNroComp = "0000000000" & rsEncabFact!NroFE
        Case 11: VNroComp = "000000000" & rsEncabFact!NroFE
        Case 12: VNroComp = "00000000" & rsEncabFact!NroFE
        Case 13: VNroComp = "0000000" & rsEncabFact!NroFE
        Case 14: VNroComp = "000000" & rsEncabFact!NroFE
        Case 15: VNroComp = "00000" & rsEncabFact!NroFE
        Case 16: VNroComp = "0000" & rsEncabFact!NroFE
        Case 17: VNroComp = "000" & rsEncabFact!NroFE
        Case 18: VNroComp = "00" & rsEncabFact!NroFE
        Case 19: VNroComp = "0" & rsEncabFact!NroFE
        Case 20: VNroComp = rsEncabFact!NroFE
    End Select
    VLinea = VLinea & VNroComp
    'codigo de comprador
    VCodDoc = "80"
    VLinea = VLinea & VCodDoc
    'nro de documento o cuit
     If rsEncabFact!Emp_Flet = 1 Then
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!CodClie & "")
         VNroDoc = "000000000" & Mid(rsFleteros!cuit, 1, 2) & Mid(rsFleteros!cuit, 4, 8) & Mid(rsFleteros!cuit, 13, 1)
        If Not Len(VNroDoc) = 20 Then
            MsgBox ("Error")
        End If
        VTamaño = Len(rsFleteros!DescFlet)
        Select Case VTamaño
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
    Else
        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
        VNroDoc = "000000000" & Mid(rsEmpresas!cuit, 1, 2) & Mid(rsEmpresas!cuit, 4, 8) & Mid(rsEmpresas!cuit, 13, 1)
        VTamaño = Len(rsEmpresas!DescEmpresas)
        Select Case VTamaño
            Case 1: VAyN = rsEmpresas!DescEmpresas & "                             "
            Case 2: VAyN = rsEmpresas!DescEmpresas & "                            "
            Case 3: VAyN = rsEmpresas!DescEmpresas & "                           "
            Case 4: VAyN = rsEmpresas!DescEmpresas & "                          "
            Case 5: VAyN = rsEmpresas!DescEmpresas & "                         "
            Case 6: VAyN = rsEmpresas!DescEmpresas & "                        "
            Case 7: VAyN = rsEmpresas!DescEmpresas & "                       "
            Case 8: VAyN = rsEmpresas!DescEmpresas & "                      "
            Case 9: VAyN = rsEmpresas!DescEmpresas & "                     "
            Case 10: VAyN = rsEmpresas!DescEmpresas & "                    "
            Case 11: VAyN = rsEmpresas!DescEmpresas & "                   "
            Case 12: VAyN = rsEmpresas!DescEmpresas & "                  "
            Case 13: VAyN = rsEmpresas!DescEmpresas & "                 "
            Case 14: VAyN = rsEmpresas!DescEmpresas & "                "
            Case 15: VAyN = rsEmpresas!DescEmpresas & "               "
            Case 16: VAyN = rsEmpresas!DescEmpresas & "              "
            Case 17: VAyN = rsEmpresas!DescEmpresas & "             "
            Case 18: VAyN = rsEmpresas!DescEmpresas & "            "
            Case 19: VAyN = rsEmpresas!DescEmpresas & "           "
            Case 20: VAyN = rsEmpresas!DescEmpresas & "          "
            Case 21: VAyN = rsEmpresas!DescEmpresas & "         "
            Case 22: VAyN = rsEmpresas!DescEmpresas & "        "
            Case 23: VAyN = rsEmpresas!DescEmpresas & "       "
            Case 24: VAyN = rsEmpresas!DescEmpresas & "      "
            Case 25: VAyN = rsEmpresas!DescEmpresas & "     "
            Case 26: VAyN = rsEmpresas!DescEmpresas & "    "
            Case 27: VAyN = rsEmpresas!DescEmpresas & "   "
            Case 28: VAyN = rsEmpresas!DescEmpresas & "  "
            Case 29: VAyN = rsEmpresas!DescEmpresas & " "
            Case Is >= 30: VAyN = Mid(rsEmpresas!DescEmpresas, 1, 30)
        End Select
        If Len(VAyN) = 30 Then
            VLinea = VLinea & VNroDoc & VAyN
        Else
            MsgBox "Error"
        End If
        Set rsEmpresas = Nothing
    End If
    'importe total de la operacion
    vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFact!totalgralfe))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!totalgralfe), i, 1)
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
    ' OTROS TRIBUTOS
    VOtroTib = "000000000000000"
    VLinea = VLinea & VOtroTib
    'FECHA DE PAGO
    If Not rsEncabFact!TipoSistema = 201 Then
        Vfecha = rsEncabFact!FPago
        VFechaPago = Vfecha
    Else
        VFechaPago = "00000000"
    End If
    VLinea = VLinea & VFechaPago
    VTamaño = Len(VLinea)
    '////GRABA LINEA EN ARCHIVO COMPROBANTE////
    If VTamaño = 266 Then
         Archivo.WriteLine VLinea
    Else
        
        Archivo.WriteLine VLinea
    End If
    
    VLinea = ""
    VLinea = VComp & VPtoVta & VNroComp
    
    'BUSCA NETO GRABADO
    If rsEncabFact!TipoSistema = 203 Then
        Set rsDetFact = db.OpenRecordset("Select * From DetFe Where NroFact = " & rsEncabFact!NroFE & " and TipoComp = " & rsEncabFact!TipoSistema & "  AND PtoVta = " & rsEncabFact!PtoVtaFE & " Order By Alicuota")
    Else
        Set rsDetFact = db.OpenRecordset("Select * From DetFe Where NroFact = " & rsEncabFact!NroFE & " and TipoComp = " & rsEncabFact!TipoAfip & " AND PtoVta = " & rsEncabFact!PtoVtaFE & " Order By Alicuota")
    End If
    'Set rsDetFact = rs.OpenRecordset("Select * from DetFE Where NroFact = " & rsEncabFact!NroFE & " And PtoVta = " & rsEncabFact!PtoVtaFE & " And TipoComp = " & rsEncabFact!TipoAfip & "")
    VAlicuota = rsDetFact!Alicuota
    vimporte = ""
    VImporte1 = 0
    Do While Not rsDetFact.EOF
        If VAlicuota = rsDetFact!Alicuota Then
            VImporte1 = VImporte1 + rsDetFact!STotal
            rsDetFact.MoveNext
        Else
            VTamaño = Len(FormatNumber(VImporte1))
            i = 0
            For i = i + 1 To VTamaño + 1
                DIGITO = Mid(FormatNumber(VImporte1), i, 1)
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
            If VAlicuota = 21 Then
                VLinea = VLinea & "0005"
            ElseIf VAlicuota = 10.5 Then
                VLinea = VLinea & "0004"
            End If
            'IMPORTE DE IVA
            vimporte = ""
            ImpIVA = ""
            ImpIVA = VImporte1 * VAlicuota / 100
            VTamaño = Len(FormatNumber(ImpIVA))
            i = 0
            For i = i + 1 To VTamaño + 1
                DIGITO = Mid(FormatNumber(ImpIVA), i, 1)
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
            If VTamaño = 62 Then
                ArchivoAlic.WriteLine VLinea
            Else
                ArchivoAlic.WriteLine VLinea
            End If
        End If
    Loop
    VTamaño = Len(FormatNumber(VImporte1))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(VImporte1), i, 1)
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
    If VAlicuota = 21 Then
        VLinea = VLinea & "0005"
    ElseIf VAlicuota = 10.5 Then
        VLinea = VLinea & "0004"
    End If
    'IMPORTE DE IVA
    vimporte = ""
    ImpIVA = 0
    ImpIVA = VImporte1 * VAlicuota / 100
    VTamaño = Len(FormatNumber(ImpIVA))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(ImpIVA), i, 1)
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
    If VTamaño = 62 Then
        ArchivoAlic.WriteLine VLinea
    Else
        ArchivoAlic.WriteLine VLinea
    End If
    rsEncabFact.MoveNext
Loop
Set rsEncabFact = Nothing

'CTA Y VTA DE LIQUIDO PRODUCTO
Set rsEncabFact = db.OpenRecordset("SELECT * FROM EncabLProd WHERE Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " #") '
Do While Not rsEncabFact.EOF
    If rsEncabFact!totalviajeS1 = 0 Then
    VLinea = ""
    'Fecha
    Vfecha = Mid(rsEncabFact!Fecha, 7, 4) & Mid(rsEncabFact!Fecha, 4, 2) & Mid(rsEncabFact!Fecha, 1, 2)
    VLinea = Vfecha
    'tipo de comprobante
    VTamaño = Len(rsEncabFact!TipoAfip)
    Select Case VTamaño
        Case 1: VComp = "00" & rsEncabFact!TipoAfip
        Case 2: VComp = "0" & rsEncabFact!TipoAfip
        Case 3: VComp = rsEncabFact!TipoAfip
    End Select
    If Len(VComp) = 3 Then
        VLinea = VLinea & VComp
    Else
      MsgBox "Error VComp"
    End If
    'pto de venta
    VTamaño = Len(rsEncabFact!PtoVta)
    Select Case VTamaño
        Case 1: VPtoVta = "0000" & rsEncabFact!PtoVta
        Case 2: VPtoVta = "000" & rsEncabFact!PtoVta
        Case 3: VPtoVta = "00" & rsEncabFact!PtoVta
        Case 4: VPtoVta = "0" & rsEncabFact!PtoVta
        Case 5: VPtoVta = rsEncabFact!PtoVta
    End Select
    If Len(VPtoVta) = 5 Then
        VLinea = VLinea & VPtoVta
    Else
        MsgBox "Error en el PtoVta"
    End If
    ''nro de comprobante
    VTamaño = Len(rsEncabFact!NroComp)
    Select Case VTamaño
        Case 1: VNroComp = "0000000000000000000" & rsEncabFact!NroComp
        Case 2: VNroComp = "000000000000000000" & rsEncabFact!NroComp
        Case 3: VNroComp = "00000000000000000" & rsEncabFact!NroComp
        Case 4: VNroComp = "0000000000000000" & rsEncabFact!NroComp
        Case 5: VNroComp = "000000000000000" & rsEncabFact!NroComp
        Case 6: VNroComp = "00000000000000" & rsEncabFact!NroComp
        Case 7: VNroComp = "0000000000000" & rsEncabFact!NroComp
        Case 8: VNroComp = "000000000000" & rsEncabFact!NroComp
        Case 9: VNroComp = "00000000000" & rsEncabFact!NroComp
        Case 10: VNroComp = "0000000000" & rsEncabFact!NroComp
        Case 11: VNroComp = "000000000" & rsEncabFact!NroComp
        Case 12: VNroComp = "00000000" & rsEncabFact!NroComp
        Case 13: VNroComp = "0000000" & rsEncabFact!NroComp
        Case 14: VNroComp = "000000" & rsEncabFact!NroComp
        Case 15: VNroComp = "00000" & rsEncabFact!NroComp
        Case 16: VNroComp = "0000" & rsEncabFact!NroComp
        Case 17: VNroComp = "000" & rsEncabFact!NroComp
        Case 18: VNroComp = "00" & rsEncabFact!NroComp
        Case 19: VNroComp = "0" & rsEncabFact!NroComp
        Case 20: VNroComp = rsEncabFact!NroComp
    End Select
    If Len(VNroComp) = 20 Then
        VLinea = VLinea & VNroComp
    Else
        MsgBox "Error en el Nro de comprobante"
    End If
    'nro de comprobante hasta
    Select Case VTamaño
        Case 1: VNroComp = "0000000000000000000" & rsEncabFact!NroComp
        Case 2: VNroComp = "000000000000000000" & rsEncabFact!NroComp
        Case 3: VNroComp = "00000000000000000" & rsEncabFact!NroComp
        Case 4: VNroComp = "0000000000000000" & rsEncabFact!NroComp
        Case 5: VNroComp = "000000000000000" & rsEncabFact!NroComp
       Case 6: VNroComp = "00000000000000" & rsEncabFact!NroComp
        Case 7: VNroComp = "0000000000000" & rsEncabFact!NroComp
        Case 8: VNroComp = "000000000000" & rsEncabFact!NroComp
        Case 9: VNroComp = "00000000000" & rsEncabFact!NroComp
        Case 10: VNroComp = "0000000000" & rsEncabFact!NroComp
         Case 11: VNroComp = "000000000" & rsEncabFact!NroComp
        Case 12: VNroComp = "00000000" & rsEncabFact!NroComp
        Case 13: VNroComp = "0000000" & rsEncabFact!NroComp
        Case 14: VNroComp = "000000" & rsEncabFact!NroComp
        Case 15: VNroComp = "00000" & rsEncabFact!NroComp
        Case 16: VNroComp = "0000" & rsEncabFact!NroComp
        Case 17: VNroComp = "000" & rsEncabFact!NroComp
        Case 18: VNroComp = "00" & rsEncabFact!NroComp
        Case 19: VNroComp = "0" & rsEncabFact!NroComp
        Case 20: VNroComp = rsEncabFact!NroComp
    End Select
    VLinea = VLinea & VNroComp
    'codigo de comprador
    VCodDoc = "80"
    VLinea = VLinea & VCodDoc
    'nro de documento o cuit
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!CodFlet & "")
         VNroDoc = "000000000" & Mid(rsFleteros!cuit, 1, 2) & Mid(rsFleteros!cuit, 4, 8) & Mid(rsFleteros!cuit, 13, 1)
        If Not Len(VNroDoc) = 20 Then
            MsgBox ("Error")
        End If
        VTamaño = Len(rsFleteros!DescFlet)
        Select Case VTamaño
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
   
    ' 'importe total de la operacion
    vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFact!totalcomis))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!totalcomis), i, 1)
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
    ' OTROS TRIBUTOS
    VOtroTib = "000000000000000"
    VLinea = VLinea & VOtroTib
    'FECHA DE PAGO
    VFechaPago = Vfecha
    VLinea = VLinea & "00000000"
    VTamaño = Len(VLinea)
    '////GRABA LINEA EN ARCHIVO COMPROBANTE////
    If VTamaño = 266 Then
         Archivo.WriteLine VLinea
    Else
   
       Archivo.WriteLine VLinea
    End If
   '
    VLinea = ""
    VLinea = VComp & VPtoVta & VNroComp
   
    'BUSCA NETO GRABADO
   vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFact!netocomis))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!netocomis), i, 1)
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
    VTamaño = Len(FormatNumber(rsEncabFact!IVAComis))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!IVAComis), i, 1)
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
    ''////GRABA LINEA EN ARCHIVO ALICUOTA////
    VTamaño = Len(VLinea)
    If VTamaño = 62 Then
         ArchivoAlic.WriteLine VLinea
    Else
    
        ArchivoAlic.WriteLine VLinea
    End If

    End If
    rsEncabFact.MoveNext
   
Loop
Set rsEncabFact = Nothing

'FACTURAS POR CUENTA Y ORDEN

Set rsEncabFact = db.OpenRecordset("SELECT * FROM EncabFactCta WHERE Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " #")
Do While Not rsEncabFact.EOF
    If Not rsEncabFact!Codigo = "99999" Then
    VLinea = ""
    'fecha
    Vfecha = Mid(rsEncabFact!Fecha, 7, 4) & Mid(rsEncabFact!Fecha, 4, 2) & Mid(rsEncabFact!Fecha, 1, 2)
    VLinea = Vfecha
    'tipo de comprobante
    VComp = "001"
    If Len(VComp) = 3 Then
        VLinea = VLinea & VComp
    Else
        MsgBox "Error VComp"
    End If
    'pto de venta
    VPtoVta = "00001"
    If Len(VPtoVta) = 5 Then
        VLinea = VLinea & VPtoVta
    Else
        MsgBox "Error en el PtoVta"
    End If
    'nro de comprobante
    VTamaño = Len(rsEncabFact!NroFact)
    Select Case VTamaño
        Case 1: VNroComp = "0000000000000000000" & rsEncabFact!NroFact
        Case 2: VNroComp = "000000000000000000" & rsEncabFact!NroFact
        Case 3: VNroComp = "00000000000000000" & rsEncabFact!NroFact
        Case 4: VNroComp = "0000000000000000" & rsEncabFact!NroFact
        Case 5: VNroComp = "000000000000000" & rsEncabFact!NroFact
        Case 6: VNroComp = "00000000000000" & rsEncabFact!NroFact
        Case 7: VNroComp = "0000000000000" & rsEncabFact!NroFact
        Case 8: VNroComp = "000000000000" & rsEncabFact!NroFact
        Case 9: VNroComp = "00000000000" & rsEncabFact!NroFact
        Case 10: VNroComp = "0000000000" & rsEncabFact!NroFact
        Case 11: VNroComp = "000000000" & rsEncabFact!NroFact
        Case 12: VNroComp = "00000000" & rsEncabFact!NroFact
        Case 13: VNroComp = "0000000" & rsEncabFact!NroFact
        Case 14: VNroComp = "000000" & rsEncabFact!NroFact
        Case 15: VNroComp = "00000" & rsEncabFact!NroFact
        Case 16: VNroComp = "0000" & rsEncabFact!NroFact
        Case 17: VNroComp = "000" & rsEncabFact!NroFact
        Case 18: VNroComp = "00" & rsEncabFact!NroFact
        Case 19: VNroComp = "0" & rsEncabFact!NroFact
        Case 20: VNroComp = rsEncabFact!NroFact
    End Select
    If Len(VNroComp) = 20 Then
        VLinea = VLinea & VNroComp
    Else
        MsgBox "Error en el Nro de comprobante"
    End If
    'nro de comprobante hasta
    Select Case VTamaño
        Case 1: VNroComp = "0000000000000000000" & rsEncabFact!NroFact
        Case 2: VNroComp = "000000000000000000" & rsEncabFact!NroFact
        Case 3: VNroComp = "00000000000000000" & rsEncabFact!NroFact
        Case 4: VNroComp = "0000000000000000" & rsEncabFact!NroFact
        Case 5: VNroComp = "000000000000000" & rsEncabFact!NroFact
        Case 6: VNroComp = "00000000000000" & rsEncabFact!NroFact
        Case 7: VNroComp = "0000000000000" & rsEncabFact!NroFact
        Case 8: VNroComp = "000000000000" & rsEncabFact!NroFact
        Case 9: VNroComp = "00000000000" & rsEncabFact!NroFact
        Case 10: VNroComp = "0000000000" & rsEncabFact!NroFact
        Case 11: VNroComp = "000000000" & rsEncabFact!NroFact
        Case 12: VNroComp = "00000000" & rsEncabFact!NroFact
        Case 13: VNroComp = "0000000" & rsEncabFact!NroFact
        Case 14: VNroComp = "000000" & rsEncabFact!NroFact
        Case 15: VNroComp = "00000" & rsEncabFact!NroFact
        Case 16: VNroComp = "0000" & rsEncabFact!NroFact
        Case 17: VNroComp = "000" & rsEncabFact!NroFact
        Case 18: VNroComp = "00" & rsEncabFact!NroFact
        Case 19: VNroComp = "0" & rsEncabFact!NroFact
        Case 20: VNroComp = rsEncabFact!NroFact
    End Select
    VLinea = VLinea & VNroComp
    'codigo de comprador
    VCodDoc = "80"
    VLinea = VLinea & VCodDoc
    'nro de documento o cuit
    Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!Codigo & "")
    VNroDoc = "000000000" & Mid(rsEmpresas!cuit, 1, 2) & Mid(rsEmpresas!cuit, 4, 8) & Mid(rsEmpresas!cuit, 13, 1)
    VTamaño = Len(rsEmpresas!DescEmpresas)
    Select Case VTamaño
        Case 1: VAyN = rsEmpresas!DescEmpresas & "                             "
        Case 2: VAyN = rsEmpresas!DescEmpresas & "                            "
        Case 3: VAyN = rsEmpresas!DescEmpresas & "                           "
        Case 4: VAyN = rsEmpresas!DescEmpresas & "                          "
        Case 5: VAyN = rsEmpresas!DescEmpresas & "                         "
        Case 6: VAyN = rsEmpresas!DescEmpresas & "                        "
        Case 7: VAyN = rsEmpresas!DescEmpresas & "                       "
        Case 8: VAyN = rsEmpresas!DescEmpresas & "                      "
        Case 9: VAyN = rsEmpresas!DescEmpresas & "                     "
        Case 10: VAyN = rsEmpresas!DescEmpresas & "                    "
        Case 11: VAyN = rsEmpresas!DescEmpresas & "                   "
        Case 12: VAyN = rsEmpresas!DescEmpresas & "                  "
        Case 13: VAyN = rsEmpresas!DescEmpresas & "                 "
        Case 14: VAyN = rsEmpresas!DescEmpresas & "                "
        Case 15: VAyN = rsEmpresas!DescEmpresas & "               "
        Case 16: VAyN = rsEmpresas!DescEmpresas & "              "
        Case 17: VAyN = rsEmpresas!DescEmpresas & "             "
        Case 18: VAyN = rsEmpresas!DescEmpresas & "            "
        Case 19: VAyN = rsEmpresas!DescEmpresas & "           "
        Case 20: VAyN = rsEmpresas!DescEmpresas & "          "
        Case 21: VAyN = rsEmpresas!DescEmpresas & "         "
        Case 22: VAyN = rsEmpresas!DescEmpresas & "        "
        Case 23: VAyN = rsEmpresas!DescEmpresas & "       "
        Case 24: VAyN = rsEmpresas!DescEmpresas & "      "
        Case 25: VAyN = rsEmpresas!DescEmpresas & "     "
        Case 26: VAyN = rsEmpresas!DescEmpresas & "    "
        Case 27: VAyN = rsEmpresas!DescEmpresas & "   "
        Case 28: VAyN = rsEmpresas!DescEmpresas & "  "
        Case 29: VAyN = rsEmpresas!DescEmpresas & " "
        Case Is >= 30: VAyN = Mid(rsEmpresas!DescEmpresas, 1, 30)
    End Select
    If Len(VAyN) = 30 Then
        VLinea = VLinea & VNroDoc & VAyN
    Else
        MsgBox "Error"
    End If
    Set rsEmpresas = Nothing
    'importe total de la operacion
    vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFact!TGral))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!TGral), i, 1)
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
    ' OTROS TRIBUTOS
    VOtroTib = "000000000000000"
    VLinea = VLinea & VOtroTib
    'FECHA DE PAGO
    VFechaPago = Vfecha
    VLinea = VLinea & VFechaPago
    VTamaño = Len(VLinea)
    If VTamaño = 266 Then
         Archivo.WriteLine VLinea
    Else
        
        Archivo.WriteLine VLinea
    End If
    '///GRABA ARCHIVO DE ALICUOTAS
    VLinea = ""
    VLinea = VComp & VPtoVta & VNroComp
    
    'BUSCA NETO GRABADO
    vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFact!TNeto))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!TNeto), i, 1)
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
    VTamaño = Len(FormatNumber(rsEncabFact!TIVA))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!TIVA), i, 1)
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
    If VTamaño = 62 Then
         ArchivoAlic.WriteLine VLinea
    Else
        
        ArchivoAlic.WriteLine VLinea
    End If
    End If
    rsEncabFact.MoveNext
    
Loop
 Archivo.Close
End Sub

Private Sub Form_Load()
FDesde.Mask = ""
FDesde.Text = ""
FDesde.Mask = "##/##/####"
FHasta.Mask = ""
FHasta.Text = ""
FHasta.Mask = "##/##/####"
Option1(0).Value = True
Option1(1).Value = False
Check1.Value = 1
Check2.Value = 0
End Sub

Private Sub KewlButtons1_Click()
Dim Vfecha, VComp, VPtoVta, VNroComp, VCodDoc, VNroDoc, VAyN, VImpTotal, VNoGrabado As String
Dim VPerc, VImpExentas, VImpPagoCta, VImpPerIIBB, VImpMuni, VImpInternos, VCodMoneda, VTipoCambio As String
Dim VCantAlicIVa, VCodOperacion, VOtroTib, VFechaPago As String
Dim VLinea, VLinea1 As String
Dim VTamaño As Integer
Dim obj_FSO As Object
Dim Archivo As Object
Dim ArchivoAlic As Object
Dim NombreArch As String
Set obj_FSO = CreateObject("Scripting.FileSystemObject")
  
'Creamos un archivo con el método CreateTextFile
NombreArch = Mid(FDesde, 7, 4) & Mid(FDesde, 4, 2)
NombreArch = "\citi\ComprobantesVentas_" & NombreArch & ".txt"
Set Archivo = obj_FSO.CreateTextFile(App.Path + NombreArch, True)
NombreArch = Mid(FDesde, 7, 4) & Mid(FDesde, 4, 2)
NombreArch = "\citi\AlicVentas_" & NombreArch & ".txt"
Set ArchivoAlic = obj_FSO.CreateTextFile(App.Path + NombreArch, True)
'FACTURAS ELECTRONICAS

Set rsEncabFact = db.OpenRecordset("SELECT * FROM EncabFE WHERE FechaFE BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " #")
Do While Not rsEncabFact.EOF
    VLinea = ""
    'fecha
    Vfecha = Mid(rsEncabFact!FechaFE, 7, 4) & Mid(rsEncabFact!FechaFE, 4, 2) & Mid(rsEncabFact!FechaFE, 1, 2)
    VLinea = Vfecha
    'tipo de comprobante
    VTamaño = Len(rsEncabFact!TipoAfip)
    Select Case VTamaño
        Case 1: VComp = "00" & rsEncabFact!TipoAfip
        Case 2: VComp = "0" & rsEncabFact!TipoAfip
        Case 3: VComp = rsEncabFact!TipoAfip
    End Select
    If Len(VComp) = 3 Then
        VLinea = VLinea & VComp
    Else
        MsgBox "Error VComp"
    End If
    'pto de venta
    VTamaño = Len(rsEncabFact!PtoVtaFE)
    Select Case VTamaño
        Case 1: VPtoVta = "0000" & rsEncabFact!PtoVtaFE
        Case 2: VPtoVta = "000" & rsEncabFact!PtoVtaFE
        Case 3: VPtoVta = "00" & rsEncabFact!PtoVtaFE
        Case 4: VPtoVta = "0" & rsEncabFact!PtoVtaFE
        Case 5: VPtoVta = rsEncabFact!PtoVtaFE
    End Select
    If Len(VPtoVta) = 5 Then
        VLinea = VLinea & VPtoVta
    Else
        MsgBox "Error en el PtoVta"
    End If
    'nro de comprobante
    VTamaño = Len(rsEncabFact!NroFE)
    Select Case VTamaño
        Case 1: VNroComp = "0000000000000000000" & rsEncabFact!NroFE
        Case 2: VNroComp = "000000000000000000" & rsEncabFact!NroFE
        Case 3: VNroComp = "00000000000000000" & rsEncabFact!NroFE
        Case 4: VNroComp = "0000000000000000" & rsEncabFact!NroFE
        Case 5: VNroComp = "000000000000000" & rsEncabFact!NroFE
        Case 6: VNroComp = "00000000000000" & rsEncabFact!NroFE
        Case 7: VNroComp = "0000000000000" & rsEncabFact!NroFE
        Case 8: VNroComp = "000000000000" & rsEncabFact!NroFE
        Case 9: VNroComp = "00000000000" & rsEncabFact!NroFE
        Case 10: VNroComp = "0000000000" & rsEncabFact!NroFE
        Case 11: VNroComp = "000000000" & rsEncabFact!NroFE
        Case 12: VNroComp = "00000000" & rsEncabFact!NroFE
        Case 13: VNroComp = "0000000" & rsEncabFact!NroFE
        Case 14: VNroComp = "000000" & rsEncabFact!NroFE
        Case 15: VNroComp = "00000" & rsEncabFact!NroFE
        Case 16: VNroComp = "0000" & rsEncabFact!NroFE
        Case 17: VNroComp = "000" & rsEncabFact!NroFE
        Case 18: VNroComp = "00" & rsEncabFact!NroFE
        Case 19: VNroComp = "0" & rsEncabFact!NroFE
        Case 20: VNroComp = rsEncabFact!NroFE
    End Select
    If Len(VNroComp) = 20 Then
        VLinea = VLinea & VNroComp
    Else
        MsgBox "Error en el Nro de comprobante"
    End If
    'nro de comprobante hasta
    Select Case VTamaño
        Case 1: VNroComp = "0000000000000000000" & rsEncabFact!NroFE
        Case 2: VNroComp = "000000000000000000" & rsEncabFact!NroFE
        Case 3: VNroComp = "00000000000000000" & rsEncabFact!NroFE
        Case 4: VNroComp = "0000000000000000" & rsEncabFact!NroFE
        Case 5: VNroComp = "000000000000000" & rsEncabFact!NroFE
        Case 6: VNroComp = "00000000000000" & rsEncabFact!NroFE
        Case 7: VNroComp = "0000000000000" & rsEncabFact!NroFE
        Case 8: VNroComp = "000000000000" & rsEncabFact!NroFE
        Case 9: VNroComp = "00000000000" & rsEncabFact!NroFE
        Case 10: VNroComp = "0000000000" & rsEncabFact!NroFE
        Case 11: VNroComp = "000000000" & rsEncabFact!NroFE
        Case 12: VNroComp = "00000000" & rsEncabFact!NroFE
        Case 13: VNroComp = "0000000" & rsEncabFact!NroFE
        Case 14: VNroComp = "000000" & rsEncabFact!NroFE
        Case 15: VNroComp = "00000" & rsEncabFact!NroFE
        Case 16: VNroComp = "0000" & rsEncabFact!NroFE
        Case 17: VNroComp = "000" & rsEncabFact!NroFE
        Case 18: VNroComp = "00" & rsEncabFact!NroFE
        Case 19: VNroComp = "0" & rsEncabFact!NroFE
        Case 20: VNroComp = rsEncabFact!NroFE
    End Select
    VLinea = VLinea & VNroComp
    'codigo de comprador
    VCodDoc = "80"
    VLinea = VLinea & VCodDoc
    'nro de documento o cuit
     If rsEncabFact!Emp_Flet = 1 Then
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!CodClie & "")
         VNroDoc = "000000000" & Mid(rsFleteros!cuit, 1, 2) & Mid(rsFleteros!cuit, 4, 8) & Mid(rsFleteros!cuit, 13, 1)
        If Not Len(VNroDoc) = 20 Then
            MsgBox ("Error")
        End If
        VTamaño = Len(rsFleteros!DescFlet)
        Select Case VTamaño
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
    Else
        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
        VNroDoc = "000000000" & Mid(rsEmpresas!cuit, 1, 2) & Mid(rsEmpresas!cuit, 4, 8) & Mid(rsEmpresas!cuit, 13, 1)
        VTamaño = Len(rsEmpresas!DescEmpresas)
        Select Case VTamaño
            Case 1: VAyN = rsEmpresas!DescEmpresas & "                             "
            Case 2: VAyN = rsEmpresas!DescEmpresas & "                            "
            Case 3: VAyN = rsEmpresas!DescEmpresas & "                           "
            Case 4: VAyN = rsEmpresas!DescEmpresas & "                          "
            Case 5: VAyN = rsEmpresas!DescEmpresas & "                         "
            Case 6: VAyN = rsEmpresas!DescEmpresas & "                        "
            Case 7: VAyN = rsEmpresas!DescEmpresas & "                       "
            Case 8: VAyN = rsEmpresas!DescEmpresas & "                      "
            Case 9: VAyN = rsEmpresas!DescEmpresas & "                     "
            Case 10: VAyN = rsEmpresas!DescEmpresas & "                    "
            Case 11: VAyN = rsEmpresas!DescEmpresas & "                   "
            Case 12: VAyN = rsEmpresas!DescEmpresas & "                  "
            Case 13: VAyN = rsEmpresas!DescEmpresas & "                 "
            Case 14: VAyN = rsEmpresas!DescEmpresas & "                "
            Case 15: VAyN = rsEmpresas!DescEmpresas & "               "
            Case 16: VAyN = rsEmpresas!DescEmpresas & "              "
            Case 17: VAyN = rsEmpresas!DescEmpresas & "             "
            Case 18: VAyN = rsEmpresas!DescEmpresas & "            "
            Case 19: VAyN = rsEmpresas!DescEmpresas & "           "
            Case 20: VAyN = rsEmpresas!DescEmpresas & "          "
            Case 21: VAyN = rsEmpresas!DescEmpresas & "         "
            Case 22: VAyN = rsEmpresas!DescEmpresas & "        "
            Case 23: VAyN = rsEmpresas!DescEmpresas & "       "
            Case 24: VAyN = rsEmpresas!DescEmpresas & "      "
            Case 25: VAyN = rsEmpresas!DescEmpresas & "     "
            Case 26: VAyN = rsEmpresas!DescEmpresas & "    "
            Case 27: VAyN = rsEmpresas!DescEmpresas & "   "
            Case 28: VAyN = rsEmpresas!DescEmpresas & "  "
            Case 29: VAyN = rsEmpresas!DescEmpresas & " "
            Case Is >= 30: VAyN = Mid(rsEmpresas!DescEmpresas, 1, 30)
        End Select
        If Len(VAyN) = 30 Then
            VLinea = VLinea & VNroDoc & VAyN
        Else
            MsgBox "Error"
        End If
        Set rsEmpresas = Nothing
    End If
    'importe total de la operacion
    vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFact!totalgralfe))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!totalgralfe), i, 1)
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
    ' OTROS TRIBUTOS
    VOtroTib = "000000000000000"
    VLinea = VLinea & VOtroTib
    'FECHA DE PAGO
    If Not rsEncabFact!TipoSistema = 201 Then
        Vfecha = rsEncabFact!FPago
        VFechaPago = Vfecha
    Else
        VFechaPago = "00000000"
    End If
    VLinea = VLinea & VFechaPago
    VTamaño = Len(VLinea)
    '////GRABA LINEA EN ARCHIVO COMPROBANTE////
    If VTamaño = 266 Then
         Archivo.WriteLine VLinea
    Else
        
        Archivo.WriteLine VLinea
    End If
    
    VLinea = ""
    VLinea = VComp & VPtoVta & VNroComp
    
    'BUSCA NETO GRABADO
    vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFact!TotalNetofe))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!TotalNetofe), i, 1)
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
    VTamaño = Len(FormatNumber(rsEncabFact!TotalIVAFE))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!TotalIVAFE), i, 1)
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
    If VTamaño = 62 Then
         ArchivoAlic.WriteLine VLinea
    Else
        
        ArchivoAlic.WriteLine VLinea
    End If
    
    rsEncabFact.MoveNext
    
Loop
Set rsEncabFact = Nothing

'CTA Y VTA DE LIQUIDO PRODUCTO
Set rsEncabFact = db.OpenRecordset("SELECT * FROM EncabLProd WHERE Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " #") '
Do While Not rsEncabFact.EOF
    If rsEncabFact!totalviajeS1 = 0 Then
    VLinea = ""
    'Fecha
    Vfecha = Mid(rsEncabFact!Fecha, 7, 4) & Mid(rsEncabFact!Fecha, 4, 2) & Mid(rsEncabFact!Fecha, 1, 2)
    VLinea = Vfecha
    'tipo de comprobante
    VTamaño = Len(rsEncabFact!TipoAfip)
    Select Case VTamaño
        Case 1: VComp = "00" & rsEncabFact!TipoAfip
        Case 2: VComp = "0" & rsEncabFact!TipoAfip
        Case 3: VComp = rsEncabFact!TipoAfip
    End Select
    If Len(VComp) = 3 Then
        VLinea = VLinea & VComp
    Else
      MsgBox "Error VComp"
    End If
    'pto de venta
    VTamaño = Len(rsEncabFact!PtoVta)
    Select Case VTamaño
        Case 1: VPtoVta = "0000" & rsEncabFact!PtoVta
        Case 2: VPtoVta = "000" & rsEncabFact!PtoVta
        Case 3: VPtoVta = "00" & rsEncabFact!PtoVta
        Case 4: VPtoVta = "0" & rsEncabFact!PtoVta
        Case 5: VPtoVta = rsEncabFact!PtoVta
    End Select
    If Len(VPtoVta) = 5 Then
        VLinea = VLinea & VPtoVta
    Else
        MsgBox "Error en el PtoVta"
    End If
    ''nro de comprobante
    VTamaño = Len(rsEncabFact!NroComp)
    Select Case VTamaño
        Case 1: VNroComp = "0000000000000000000" & rsEncabFact!NroComp
        Case 2: VNroComp = "000000000000000000" & rsEncabFact!NroComp
        Case 3: VNroComp = "00000000000000000" & rsEncabFact!NroComp
        Case 4: VNroComp = "0000000000000000" & rsEncabFact!NroComp
        Case 5: VNroComp = "000000000000000" & rsEncabFact!NroComp
        Case 6: VNroComp = "00000000000000" & rsEncabFact!NroComp
        Case 7: VNroComp = "0000000000000" & rsEncabFact!NroComp
        Case 8: VNroComp = "000000000000" & rsEncabFact!NroComp
        Case 9: VNroComp = "00000000000" & rsEncabFact!NroComp
        Case 10: VNroComp = "0000000000" & rsEncabFact!NroComp
        Case 11: VNroComp = "000000000" & rsEncabFact!NroComp
        Case 12: VNroComp = "00000000" & rsEncabFact!NroComp
        Case 13: VNroComp = "0000000" & rsEncabFact!NroComp
        Case 14: VNroComp = "000000" & rsEncabFact!NroComp
        Case 15: VNroComp = "00000" & rsEncabFact!NroComp
        Case 16: VNroComp = "0000" & rsEncabFact!NroComp
        Case 17: VNroComp = "000" & rsEncabFact!NroComp
        Case 18: VNroComp = "00" & rsEncabFact!NroComp
        Case 19: VNroComp = "0" & rsEncabFact!NroComp
        Case 20: VNroComp = rsEncabFact!NroComp
    End Select
    If Len(VNroComp) = 20 Then
        VLinea = VLinea & VNroComp
    Else
        MsgBox "Error en el Nro de comprobante"
    End If
    'nro de comprobante hasta
    Select Case VTamaño
        Case 1: VNroComp = "0000000000000000000" & rsEncabFact!NroComp
        Case 2: VNroComp = "000000000000000000" & rsEncabFact!NroComp
        Case 3: VNroComp = "00000000000000000" & rsEncabFact!NroComp
        Case 4: VNroComp = "0000000000000000" & rsEncabFact!NroComp
        Case 5: VNroComp = "000000000000000" & rsEncabFact!NroComp
       Case 6: VNroComp = "00000000000000" & rsEncabFact!NroComp
        Case 7: VNroComp = "0000000000000" & rsEncabFact!NroComp
        Case 8: VNroComp = "000000000000" & rsEncabFact!NroComp
        Case 9: VNroComp = "00000000000" & rsEncabFact!NroComp
        Case 10: VNroComp = "0000000000" & rsEncabFact!NroComp
         Case 11: VNroComp = "000000000" & rsEncabFact!NroComp
        Case 12: VNroComp = "00000000" & rsEncabFact!NroComp
        Case 13: VNroComp = "0000000" & rsEncabFact!NroComp
        Case 14: VNroComp = "000000" & rsEncabFact!NroComp
        Case 15: VNroComp = "00000" & rsEncabFact!NroComp
        Case 16: VNroComp = "0000" & rsEncabFact!NroComp
        Case 17: VNroComp = "000" & rsEncabFact!NroComp
        Case 18: VNroComp = "00" & rsEncabFact!NroComp
        Case 19: VNroComp = "0" & rsEncabFact!NroComp
        Case 20: VNroComp = rsEncabFact!NroComp
    End Select
    VLinea = VLinea & VNroComp
    'codigo de comprador
    VCodDoc = "80"
    VLinea = VLinea & VCodDoc
    'nro de documento o cuit
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!CodFlet & "")
         VNroDoc = "000000000" & Mid(rsFleteros!cuit, 1, 2) & Mid(rsFleteros!cuit, 4, 8) & Mid(rsFleteros!cuit, 13, 1)
        If Not Len(VNroDoc) = 20 Then
            MsgBox ("Error")
        End If
        VTamaño = Len(rsFleteros!DescFlet)
        Select Case VTamaño
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
   
    ' 'importe total de la operacion
    vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFact!totalcomis))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!totalcomis), i, 1)
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
    ' OTROS TRIBUTOS
    VOtroTib = "000000000000000"
    VLinea = VLinea & VOtroTib
    'FECHA DE PAGO
    VFechaPago = Vfecha
    VLinea = VLinea & "00000000"
    VTamaño = Len(VLinea)
    '////GRABA LINEA EN ARCHIVO COMPROBANTE////
    If VTamaño = 266 Then
         Archivo.WriteLine VLinea
    Else
   
       Archivo.WriteLine VLinea
    End If
   '
    VLinea = ""
    VLinea = VComp & VPtoVta & VNroComp
   
    'BUSCA NETO GRABADO
   vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFact!netocomis))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!netocomis), i, 1)
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
    VTamaño = Len(FormatNumber(rsEncabFact!IVAComis))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!IVAComis), i, 1)
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
    ''////GRABA LINEA EN ARCHIVO ALICUOTA////
    VTamaño = Len(VLinea)
    If VTamaño = 62 Then
         ArchivoAlic.WriteLine VLinea
    Else
    
        ArchivoAlic.WriteLine VLinea
    End If

    End If
    rsEncabFact.MoveNext
   
Loop
Set rsEncabFact = Nothing

End Sub

Private Sub LibroIVA_Click()
Dim Vfecha, VComp, VPtoVta, VNroComp, VCodDoc, VNroDoc, VAyN, VImpTotal, VNoGrabado As String
Dim VPerc, VImpExentas, VImpPagoCta, VImpPerIIBB, VImpMuni, VImpInternos, VCodMoneda, VTipoCambio As String
Dim VCantAlicIVa, VCodOperacion, VOtroTib, VFechaPago As String
Dim VLinea, VLinea1 As String
Dim VTamaño As Integer
Dim obj_FSO As Object
Dim Archivo As Object
Dim ArchivoAlic As Object
Dim NombreArch As String
Set obj_FSO = CreateObject("Scripting.FileSystemObject")
  
'Creamos un archivo con el método CreateTextFile
NombreArch = Mid(FDesde, 7, 4) & Mid(FDesde, 4, 2)
NombreArch = "\citi\ComprobantesVentas_" & NombreArch & ".txt"
Set Archivo = obj_FSO.CreateTextFile(App.Path + NombreArch, True)
NombreArch = Mid(FDesde, 7, 4) & Mid(FDesde, 4, 2)
NombreArch = "\citi\AlicVentas_" & NombreArch & ".txt"
Set ArchivoAlic = obj_FSO.CreateTextFile(App.Path + NombreArch, True)
'FACTURAS ELECTRONICAS

Set rsEncabFact = db.OpenRecordset("SELECT * FROM EncabFE WHERE FechaFE BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " #")
Do While Not rsEncabFact.EOF
    VLinea = ""
    'fecha
    Vfecha = Mid(rsEncabFact!FechaFE, 7, 4) & Mid(rsEncabFact!FechaFE, 4, 2) & Mid(rsEncabFact!FechaFE, 1, 2)
    VLinea = Vfecha
    'tipo de comprobante
    VTamaño = Len(rsEncabFact!TipoAfip)
    Select Case VTamaño
        Case 1: VComp = "00" & rsEncabFact!TipoAfip
        Case 2: VComp = "0" & rsEncabFact!TipoAfip
        Case 3: VComp = rsEncabFact!TipoAfip
    End Select
    If Len(VComp) = 3 Then
        VLinea = VLinea & VComp
    Else
        MsgBox "Error VComp"
    End If
    'pto de venta
    VTamaño = Len(rsEncabFact!PtoVtaFE)
    Select Case VTamaño
        Case 1: VPtoVta = "0000" & rsEncabFact!PtoVtaFE
        Case 2: VPtoVta = "000" & rsEncabFact!PtoVtaFE
        Case 3: VPtoVta = "00" & rsEncabFact!PtoVtaFE
        Case 4: VPtoVta = "0" & rsEncabFact!PtoVtaFE
        Case 5: VPtoVta = rsEncabFact!PtoVtaFE
    End Select
    If Len(VPtoVta) = 5 Then
        VLinea = VLinea & VPtoVta
    Else
        MsgBox "Error en el PtoVta"
    End If
    'nro de comprobante
    VTamaño = Len(rsEncabFact!NroFE)
    Select Case VTamaño
        Case 1: VNroComp = "0000000000000000000" & rsEncabFact!NroFE
        Case 2: VNroComp = "000000000000000000" & rsEncabFact!NroFE
        Case 3: VNroComp = "00000000000000000" & rsEncabFact!NroFE
        Case 4: VNroComp = "0000000000000000" & rsEncabFact!NroFE
        Case 5: VNroComp = "000000000000000" & rsEncabFact!NroFE
        Case 6: VNroComp = "00000000000000" & rsEncabFact!NroFE
        Case 7: VNroComp = "0000000000000" & rsEncabFact!NroFE
        Case 8: VNroComp = "000000000000" & rsEncabFact!NroFE
        Case 9: VNroComp = "00000000000" & rsEncabFact!NroFE
        Case 10: VNroComp = "0000000000" & rsEncabFact!NroFE
        Case 11: VNroComp = "000000000" & rsEncabFact!NroFE
        Case 12: VNroComp = "00000000" & rsEncabFact!NroFE
        Case 13: VNroComp = "0000000" & rsEncabFact!NroFE
        Case 14: VNroComp = "000000" & rsEncabFact!NroFE
        Case 15: VNroComp = "00000" & rsEncabFact!NroFE
        Case 16: VNroComp = "0000" & rsEncabFact!NroFE
        Case 17: VNroComp = "000" & rsEncabFact!NroFE
        Case 18: VNroComp = "00" & rsEncabFact!NroFE
        Case 19: VNroComp = "0" & rsEncabFact!NroFE
        Case 20: VNroComp = rsEncabFact!NroFE
    End Select
    If Len(VNroComp) = 20 Then
        VLinea = VLinea & VNroComp
    Else
        MsgBox "Error en el Nro de comprobante"
    End If
    'nro de comprobante hasta
    Select Case VTamaño
        Case 1: VNroComp = "0000000000000000000" & rsEncabFact!NroFE
        Case 2: VNroComp = "000000000000000000" & rsEncabFact!NroFE
        Case 3: VNroComp = "00000000000000000" & rsEncabFact!NroFE
        Case 4: VNroComp = "0000000000000000" & rsEncabFact!NroFE
        Case 5: VNroComp = "000000000000000" & rsEncabFact!NroFE
        Case 6: VNroComp = "00000000000000" & rsEncabFact!NroFE
        Case 7: VNroComp = "0000000000000" & rsEncabFact!NroFE
        Case 8: VNroComp = "000000000000" & rsEncabFact!NroFE
        Case 9: VNroComp = "00000000000" & rsEncabFact!NroFE
        Case 10: VNroComp = "0000000000" & rsEncabFact!NroFE
        Case 11: VNroComp = "000000000" & rsEncabFact!NroFE
        Case 12: VNroComp = "00000000" & rsEncabFact!NroFE
        Case 13: VNroComp = "0000000" & rsEncabFact!NroFE
        Case 14: VNroComp = "000000" & rsEncabFact!NroFE
        Case 15: VNroComp = "00000" & rsEncabFact!NroFE
        Case 16: VNroComp = "0000" & rsEncabFact!NroFE
        Case 17: VNroComp = "000" & rsEncabFact!NroFE
        Case 18: VNroComp = "00" & rsEncabFact!NroFE
        Case 19: VNroComp = "0" & rsEncabFact!NroFE
        Case 20: VNroComp = rsEncabFact!NroFE
    End Select
    VLinea = VLinea & VNroComp
    'codigo de comprador
    VCodDoc = "80"
    VLinea = VLinea & VCodDoc
    'nro de documento o cuit
     If rsEncabFact!Emp_Flet = 1 Then
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!CodClie & "")
         VNroDoc = "000000000" & Mid(rsFleteros!cuit, 1, 2) & Mid(rsFleteros!cuit, 4, 8) & Mid(rsFleteros!cuit, 13, 1)
        If Not Len(VNroDoc) = 20 Then
            MsgBox ("Error")
        End If
        VTamaño = Len(rsFleteros!DescFlet)
        Select Case VTamaño
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
    Else
        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
        VNroDoc = "000000000" & Mid(rsEmpresas!cuit, 1, 2) & Mid(rsEmpresas!cuit, 4, 8) & Mid(rsEmpresas!cuit, 13, 1)
        VTamaño = Len(rsEmpresas!DescEmpresas)
        Select Case VTamaño
            Case 1: VAyN = rsEmpresas!DescEmpresas & "                             "
            Case 2: VAyN = rsEmpresas!DescEmpresas & "                            "
            Case 3: VAyN = rsEmpresas!DescEmpresas & "                           "
            Case 4: VAyN = rsEmpresas!DescEmpresas & "                          "
            Case 5: VAyN = rsEmpresas!DescEmpresas & "                         "
            Case 6: VAyN = rsEmpresas!DescEmpresas & "                        "
            Case 7: VAyN = rsEmpresas!DescEmpresas & "                       "
            Case 8: VAyN = rsEmpresas!DescEmpresas & "                      "
            Case 9: VAyN = rsEmpresas!DescEmpresas & "                     "
            Case 10: VAyN = rsEmpresas!DescEmpresas & "                    "
            Case 11: VAyN = rsEmpresas!DescEmpresas & "                   "
            Case 12: VAyN = rsEmpresas!DescEmpresas & "                  "
            Case 13: VAyN = rsEmpresas!DescEmpresas & "                 "
            Case 14: VAyN = rsEmpresas!DescEmpresas & "                "
            Case 15: VAyN = rsEmpresas!DescEmpresas & "               "
            Case 16: VAyN = rsEmpresas!DescEmpresas & "              "
            Case 17: VAyN = rsEmpresas!DescEmpresas & "             "
            Case 18: VAyN = rsEmpresas!DescEmpresas & "            "
            Case 19: VAyN = rsEmpresas!DescEmpresas & "           "
            Case 20: VAyN = rsEmpresas!DescEmpresas & "          "
            Case 21: VAyN = rsEmpresas!DescEmpresas & "         "
            Case 22: VAyN = rsEmpresas!DescEmpresas & "        "
            Case 23: VAyN = rsEmpresas!DescEmpresas & "       "
            Case 24: VAyN = rsEmpresas!DescEmpresas & "      "
            Case 25: VAyN = rsEmpresas!DescEmpresas & "     "
            Case 26: VAyN = rsEmpresas!DescEmpresas & "    "
            Case 27: VAyN = rsEmpresas!DescEmpresas & "   "
            Case 28: VAyN = rsEmpresas!DescEmpresas & "  "
            Case 29: VAyN = rsEmpresas!DescEmpresas & " "
            Case Is >= 30: VAyN = Mid(rsEmpresas!DescEmpresas, 1, 30)
        End Select
        If Len(VAyN) = 30 Then
            VLinea = VLinea & VNroDoc & VAyN
        Else
            MsgBox "Error"
        End If
        Set rsEmpresas = Nothing
    End If
    'importe total de la operacion
    vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFact!totalgralfe))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!totalgralfe), i, 1)
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
    VCodOperacion = " "
    VLinea = VLinea & VCodOperacion
    ' OTROS TRIBUTOS
    VOtroTib = "000000000000000"
    VLinea = VLinea & VOtroTib
    'FECHA DE PAGO
    If Not rsEncabFact!TipoSistema = 201 Then
        Vfecha = rsEncabFact!FPago
        VFechaPago = Vfecha
    Else
        VFechaPago = "00000000"
    End If
    VLinea = VLinea & VFechaPago
    VTamaño = Len(VLinea)
    '////GRABA LINEA EN ARCHIVO COMPROBANTE////
    If VTamaño = 266 Then
         Archivo.WriteLine VLinea
    Else
        
        Archivo.WriteLine VLinea
    End If
    
    VLinea = ""
    VLinea = VComp & VPtoVta & VNroComp
    
    'BUSCA NETO GRABADO
    vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFact!TotalNetofe))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!TotalNetofe), i, 1)
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
    VTamaño = Len(FormatNumber(rsEncabFact!TotalIVAFE))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!TotalIVAFE), i, 1)
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
    If VTamaño = 62 Then
         ArchivoAlic.WriteLine VLinea
    Else
        
        ArchivoAlic.WriteLine VLinea
    End If
    
    rsEncabFact.MoveNext
    
Loop
Set rsEncabFact = Nothing

'CTA Y VTA DE LIQUIDO PRODUCTO
Set rsEncabFact = db.OpenRecordset("SELECT * FROM EncabLProd WHERE Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " #") '
Do While Not rsEncabFact.EOF
    If rsEncabFact!totalviajeS1 = 0 Then
    VLinea = ""
    'Fecha
    Vfecha = Mid(rsEncabFact!Fecha, 7, 4) & Mid(rsEncabFact!Fecha, 4, 2) & Mid(rsEncabFact!Fecha, 1, 2)
    VLinea = Vfecha
    'tipo de comprobante
    VTamaño = Len(rsEncabFact!TipoAfip)
    Select Case VTamaño
        Case 1: VComp = "00" & rsEncabFact!TipoAfip
        Case 2: VComp = "0" & rsEncabFact!TipoAfip
        Case 3: VComp = rsEncabFact!TipoAfip
    End Select
    If Len(VComp) = 3 Then
        VLinea = VLinea & VComp
    Else
      MsgBox "Error VComp"
    End If
    'pto de venta
    VTamaño = Len(rsEncabFact!PtoVta)
    Select Case VTamaño
        Case 1: VPtoVta = "0000" & rsEncabFact!PtoVta
        Case 2: VPtoVta = "000" & rsEncabFact!PtoVta
        Case 3: VPtoVta = "00" & rsEncabFact!PtoVta
        Case 4: VPtoVta = "0" & rsEncabFact!PtoVta
        Case 5: VPtoVta = rsEncabFact!PtoVta
    End Select
    If Len(VPtoVta) = 5 Then
        VLinea = VLinea & VPtoVta
    Else
        MsgBox "Error en el PtoVta"
    End If
    ''nro de comprobante
    VTamaño = Len(rsEncabFact!NroComp)
    Select Case VTamaño
        Case 1: VNroComp = "0000000000000000000" & rsEncabFact!NroComp
        Case 2: VNroComp = "000000000000000000" & rsEncabFact!NroComp
        Case 3: VNroComp = "00000000000000000" & rsEncabFact!NroComp
        Case 4: VNroComp = "0000000000000000" & rsEncabFact!NroComp
        Case 5: VNroComp = "000000000000000" & rsEncabFact!NroComp
        Case 6: VNroComp = "00000000000000" & rsEncabFact!NroComp
        Case 7: VNroComp = "0000000000000" & rsEncabFact!NroComp
        Case 8: VNroComp = "000000000000" & rsEncabFact!NroComp
        Case 9: VNroComp = "00000000000" & rsEncabFact!NroComp
        Case 10: VNroComp = "0000000000" & rsEncabFact!NroComp
        Case 11: VNroComp = "000000000" & rsEncabFact!NroComp
        Case 12: VNroComp = "00000000" & rsEncabFact!NroComp
        Case 13: VNroComp = "0000000" & rsEncabFact!NroComp
        Case 14: VNroComp = "000000" & rsEncabFact!NroComp
        Case 15: VNroComp = "00000" & rsEncabFact!NroComp
        Case 16: VNroComp = "0000" & rsEncabFact!NroComp
        Case 17: VNroComp = "000" & rsEncabFact!NroComp
        Case 18: VNroComp = "00" & rsEncabFact!NroComp
        Case 19: VNroComp = "0" & rsEncabFact!NroComp
        Case 20: VNroComp = rsEncabFact!NroComp
    End Select
    If Len(VNroComp) = 20 Then
        VLinea = VLinea & VNroComp
    Else
        MsgBox "Error en el Nro de comprobante"
    End If
    'nro de comprobante hasta
    Select Case VTamaño
        Case 1: VNroComp = "0000000000000000000" & rsEncabFact!NroComp
        Case 2: VNroComp = "000000000000000000" & rsEncabFact!NroComp
        Case 3: VNroComp = "00000000000000000" & rsEncabFact!NroComp
        Case 4: VNroComp = "0000000000000000" & rsEncabFact!NroComp
        Case 5: VNroComp = "000000000000000" & rsEncabFact!NroComp
       Case 6: VNroComp = "00000000000000" & rsEncabFact!NroComp
        Case 7: VNroComp = "0000000000000" & rsEncabFact!NroComp
        Case 8: VNroComp = "000000000000" & rsEncabFact!NroComp
        Case 9: VNroComp = "00000000000" & rsEncabFact!NroComp
        Case 10: VNroComp = "0000000000" & rsEncabFact!NroComp
         Case 11: VNroComp = "000000000" & rsEncabFact!NroComp
        Case 12: VNroComp = "00000000" & rsEncabFact!NroComp
        Case 13: VNroComp = "0000000" & rsEncabFact!NroComp
        Case 14: VNroComp = "000000" & rsEncabFact!NroComp
        Case 15: VNroComp = "00000" & rsEncabFact!NroComp
        Case 16: VNroComp = "0000" & rsEncabFact!NroComp
        Case 17: VNroComp = "000" & rsEncabFact!NroComp
        Case 18: VNroComp = "00" & rsEncabFact!NroComp
        Case 19: VNroComp = "0" & rsEncabFact!NroComp
        Case 20: VNroComp = rsEncabFact!NroComp
    End Select
    VLinea = VLinea & VNroComp
    'codigo de comprador
    VCodDoc = "80"
    VLinea = VLinea & VCodDoc
    'nro de documento o cuit
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!CodFlet & "")
         VNroDoc = "000000000" & Mid(rsFleteros!cuit, 1, 2) & Mid(rsFleteros!cuit, 4, 8) & Mid(rsFleteros!cuit, 13, 1)
        If Not Len(VNroDoc) = 20 Then
            MsgBox ("Error")
        End If
        VTamaño = Len(rsFleteros!DescFlet)
        Select Case VTamaño
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
   
    ' 'importe total de la operacion
    vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFact!totalcomis))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!totalcomis), i, 1)
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
    ' OTROS TRIBUTOS
    VOtroTib = "000000000000000"
    VLinea = VLinea & VOtroTib
    'FECHA DE PAGO
    VFechaPago = Vfecha
    VLinea = VLinea & "00000000"
    VTamaño = Len(VLinea)
    '////GRABA LINEA EN ARCHIVO COMPROBANTE////
    If VTamaño = 266 Then
         Archivo.WriteLine VLinea
    Else
   
       Archivo.WriteLine VLinea
    End If
   '
    VLinea = ""
    VLinea = VComp & VPtoVta & VNroComp
   
    'BUSCA NETO GRABADO
   vimporte = ""
    VTamaño = Len(FormatNumber(rsEncabFact!netocomis))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!netocomis), i, 1)
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
    VTamaño = Len(FormatNumber(rsEncabFact!IVAComis))
    i = 0
    For i = i + 1 To VTamaño + 1
        DIGITO = Mid(FormatNumber(rsEncabFact!IVAComis), i, 1)
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
    ''////GRABA LINEA EN ARCHIVO ALICUOTA////
    VTamaño = Len(VLinea)
    If VTamaño = 62 Then
         ArchivoAlic.WriteLine VLinea
    Else
    
        ArchivoAlic.WriteLine VLinea
    End If

    End If
    rsEncabFact.MoveNext
   
Loop
Set rsEncabFact = Nothing

End Sub

Private Sub LProdVsFact_Click()
'On Error Resume Next
Set TrsLPVsFact = dbTemp.OpenRecordset("Select * From LPVsFact")
Set TrsViajes = dbTemp.OpenRecordset("Viajes_SFact")
Do While Not TrsLPVsFact.EOF
    TrsLPVsFact.Delete
    TrsLPVsFact.MoveNext
Loop
Do While Not TrsViajes.EOF
    TrsViajes.Delete
    TrsViajes.MoveNext
Loop

Set rsEncabFact = db.OpenRecordset("SELECT * FROM EncabFE WHERE FechaFE BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " # ORDER BY FechaFE")
Do While Not rsEncabFact.EOF
    If Not rsEncabFact!TipoSistema = 17 Then
        Set rsDetFact = db.OpenRecordset("Select * From DetFE Where NroFact = " & rsEncabFact!NroFE & " and TipoComp = " & rsEncabFact!TipoAfip & "")
        Do While Not rsDetFact.EOF
            Set rsDet_LP = db.OpenRecordset("Select * From LiqDetViajes Where NroRemito = '" & rsDetFact!NroRem & "' and CodEmpresa = " & rsEncabFact!CodClie & "")
            ''Set rsDet_LP = db.OpenRecordset("Select * From ViajesFactura Where NroRemito = '" & rsDetFact!NroRem & "'")
            'Set rsDet_LP = db.OpenRecordset("Select * From DetViajesLP Where Remito = '" & rsDetFact!NroRem & "'")
            If Not rsDet_LP.EOF And Not rsDet_LP.BOF Then
                With TrsLPVsFact
                    .AddNew
                    .Fields("Remito") = rsDet_LP!NroRemito
                    Set rsProvincias = db.OpenRecordset("Select * From Provincias Where CodProv = " & rsDet_LP!Provincia & "")
                    .Fields("Provincia") = rsProvincias!DescProv
                    .Fields("NroLP") = rsEncabFact!NroFE
                    .Fields("NetoLP") = rsDet_LP!sUBTOTAL
                    .Fields("NroFact") = rsDetFact!NroFact
                    .Fields("NetoFact") = rsDetFact!STotal
                    .Fields("Diferencia") = rsDetFact!STotal - rsDet_LP!sUBTOTAL
                    .Fields("CodEmpresa") = rsDet_LP!CodEmpresa
                    Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsDet_LP!CodEmpresa & "")
                    .Fields("DescEmpresa") = rsEmpresas!DescEmpresas
                    .Update
                End With
            Else
                With TrsViajes
                .AddNew
                .Fields("Fecha") = rsDetFact!FechaViaje
                .Fields("CodEmpresa") = rsEncabFact!CodClie
                .Fields("NroRem") = rsDetFact!NroRem
                Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
                .Fields("DescEmpresa") = rsEmpresas!DescEmpresas
                .Fields("Stotal") = rsDetFact!STotal
                Set rsProvincias = db.OpenRecordset("Select * From Provincias Where CodProv = " & 4 & "")
                .Fields("Procedencia") = rsProvincias!DescProv
                .Fields("NroFact") = rsEncabFact!NroFE
                .Update
                End With
            End If
            rsDetFact.MoveNext
        Loop
    Else
         With TrsLPVsFact
                    .AddNew
                    .Fields("Remito") = rsEncabFact!NroFE
                    Set rsProvincias = db.OpenRecordset("Select * From Provincias Where CodProv = 2")
                    .Fields("Provincia") = rsProvincias!DescProv
                    .Fields("NroLP") = rsEncabFact!NroFE
                    .Fields("NetoLP") = rsEncabFact!TotalNetofe * -1
                    .Fields("NroFact") = rsEncabFact!NroFE
                    .Fields("NetoFact") = rsEncabFact!TotalNetofe * -1
                    .Fields("Diferencia") = 0
                    .Fields("CodEmpresa") = rsEncabFact!CodClie
                    If rsEncabFact!Emp_Flet = 1 Then
                        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!CodClie & "")
                        .Fields("DescEmpresa") = rsEmpresas!DescEmpresas
                    Else
                        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFact!CodClie & "")
                        .Fields("DescEmpresa") = rsFleteros!DescFlet
                    End If
                        
                    .Update
                End With
    End If
    rsEncabFact.MoveNext
Loop
Dim frmRep As New InfLPVsFact
Dim frmRep1 As New InfViajeSinFact
frmRep.Show vbModal
frmRep1.Show vbModal
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
