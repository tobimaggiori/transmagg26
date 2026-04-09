VERSION 5.00
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form IVACompras 
   Caption         =   "IVA Compras"
   ClientHeight    =   2385
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   5400
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   2385
   ScaleWidth      =   5400
   Begin VB.Frame Frame1 
      Caption         =   "Opciones del Listado"
      ForeColor       =   &H00C00000&
      Height          =   975
      Left            =   360
      TabIndex        =   5
      Top             =   600
      Width           =   4935
      Begin VB.OptionButton Option1 
         Caption         =   "Analitico"
         ForeColor       =   &H00C00000&
         Height          =   255
         Index           =   0
         Left            =   720
         TabIndex        =   2
         Top             =   360
         Width           =   1335
      End
      Begin VB.OptionButton Option1 
         Caption         =   "Total por Comprobantes"
         ForeColor       =   &H00C00000&
         Height          =   255
         Index           =   1
         Left            =   2520
         TabIndex        =   3
         Top             =   360
         Width           =   2175
      End
   End
   Begin MSMask.MaskEdBox FHasta 
      Height          =   285
      Left            =   4080
      TabIndex        =   1
      Top             =   120
      Width           =   1215
      _ExtentX        =   2143
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin MSMask.MaskEdBox FDesde 
      Height          =   285
      Left            =   1560
      TabIndex        =   0
      Top             =   120
      Width           =   1215
      _ExtentX        =   2143
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin KewlButtonz.KewlButtons Consultar 
      Height          =   495
      Left            =   480
      TabIndex        =   4
      Top             =   1800
      Width           =   4695
      _ExtentX        =   8281
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Consultar"
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
      MICON           =   "IVACompras.frx":0000
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
      Caption         =   "Desde Fecha"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00C00000&
      Height          =   255
      Left            =   120
      TabIndex        =   7
      Top             =   120
      Width           =   1455
   End
   Begin VB.Label Label2 
      Caption         =   "Hasta Fecha"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00C00000&
      Height          =   255
      Left            =   2880
      TabIndex        =   6
      Top             =   120
      Width           =   1455
   End
End
Attribute VB_Name = "IVACompras"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Consultar_Click()

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
Set rsEncabFactProv = db.OpenRecordset("SELECT * FROM EncabFactProv WHERE Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " # AND LIVA = 'SI' ORDER BY Fecha")
With TrsIVAVentas
Do While Not rsEncabFactProv.EOF
    .AddNew
    .Fields("Fecha") = rsEncabFactProv!Fecha
    If rsEncabFactProv!CodProv = 99999 Then
        .Fields("DescProv") = "ANULADO"
        .Fields("PtoVta") = "0001"
        Tamaño = Len(rsEncabFactProv!NroFact)
        Select Case Tamaño
            Case 1: vnro = "0000000" & rsEncabFactProv!NroFact
            Case 2: vnro = "000000" & rsEncabFactProv!NroFact
            Case 3: vnro = "00000" & rsEncabFactProv!NroFact
            Case 4: vnro = "0000" & rsEncabFactProv!NroFact
            Case 5: vnro = "000" & rsEncabFactProv!NroFact
            Case 6: vnro = "00" & rsEncabFactProv!NroFact
            Case 7: vnro = "0" & rsEncabFactProv!NroFact
            Case 8: vnro = rsEncabFactProv!NroFact
        End Select
        .Fields("NroFact") = vnro
        .Fields("Neto") = "0.00"
        .Fields("Exento") = "0.00"
        .Fields("IVA") = "0.00"
        .Fields("Total") = "0.00"
    Else
    .Fields("CodProv") = rsEncabFactProv!CodProv
    If rsEncabFactProv!CodComp = 1 Then
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabFactProv!CodProv & "")
        .Fields("DescProv") = rsFleteros!DescFlet
        .Fields("CUIT") = rsFleteros!CUIT
        Set rsFleteros = Nothing
    End If
    Select Case rsEncabFactProv!CodComp
        Case 1, 2: .Fields("Comp") = "FACT"
        Case 3: .Fields("Comp") = "NC"
        Case 4: .Fields("Comp") = "ND"
    End Select
    .Fields("PtoVta") = "0001"
    Tamaño = Len(rsEncabFactProv!NroFact)
    Select Case Tamaño
        Case 1: vnro = "0000000" & rsEncabFactProv!NroFact
        Case 2: vnro = "000000" & rsEncabFactProv!NroFact
        Case 3: vnro = "00000" & rsEncabFactProv!NroFact
        Case 4: vnro = "0000" & rsEncabFactProv!NroFact
        Case 5: vnro = "000" & rsEncabFactProv!NroFact
        Case 6: vnro = "00" & rsEncabFactProv!NroFact
        Case 7: vnro = "0" & rsEncabFactProv!NroFact
        Case 8: vnro = rsEncabFactProv!NroFact
    End Select
    .Fields("NroFact") = vnro
    If rsEncabFactProv!CodComp = 3 Then
        .Fields("Neto") = FormatNumber(rsEncabFactProv!TotalNeto * -1)
        .Fields("Exento") = "0.00"
        .Fields("IVA") = FormatNumber(rsEncabFactProv!IVA * -1)
        .Fields("Total") = FormatNumber(rsEncabFactProv!Total * -1)
    Else
        .Fields("Neto") = FormatNumber(rsEncabFactProv!TotalNeto)
        .Fields("Exento") = "0.00"
        .Fields("IVA") = FormatNumber(rsEncabFactProv!IVA)
        .Fields("Total") = FormatNumber(rsEncabFactProv!Total)
    End If
    End If
    .Update
    rsEncabFactProv.MoveNext
Loop
End With
Dim frmRep As New InfIVACompras
frmRep.Show vbModal
End If

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

