VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form DetDesc 
   BackColor       =   &H80000007&
   Caption         =   "Detalle de Descuentos"
   ClientHeight    =   1770
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   5265
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   1770
   ScaleWidth      =   5265
   Begin VB.OptionButton Option1 
      BackColor       =   &H80000012&
      Caption         =   "Cuenta y Orden"
      ForeColor       =   &H0080C0FF&
      Height          =   195
      Index           =   1
      Left            =   2640
      TabIndex        =   4
      Top             =   840
      Width           =   1695
   End
   Begin VB.OptionButton Option1 
      BackColor       =   &H80000012&
      Caption         =   "Factura A"
      ForeColor       =   &H0080C0FF&
      Height          =   195
      Index           =   0
      Left            =   720
      TabIndex        =   3
      Top             =   840
      Width           =   1695
   End
   Begin VB.TextBox Text1 
      Height          =   375
      Left            =   3120
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   360
      Width           =   1455
   End
   Begin KewlButtonz.KewlButtons Modificar 
      Height          =   495
      Left            =   1200
      TabIndex        =   2
      Top             =   1200
      Width           =   2415
      _ExtentX        =   4260
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Ver Detalle"
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
      MICON           =   "DetDesc.frx":0000
      PICN            =   "DetDesc.frx":001C
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
      Caption         =   "Ingrese Nro de Factura"
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
      Index           =   0
      Left            =   480
      TabIndex        =   0
      Top             =   360
      Width           =   2415
   End
End
Attribute VB_Name = "DetDesc"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Form_Load()
Text1 = ""
End Sub

Private Sub Modificar_Click()
If Not Text1.Text = "" Then
    Set TrsDescDet = dbTemp.OpenRecordset("DetDesc")
    Do While Not TrsDescDet.EOF
        TrsDescDet.Delete
        TrsDescDet.MoveNext
    Loop
     Dim frmRep As New infDet_Desc
    If Option1(0).Value = True Then
        Set rsDetFact = db.OpenRecordset("Select * From DetFact Where NroFact = " & Text1 & "")
        Do While Not rsDetFact.EOF
            Set rsLiqDetDesc = db.OpenRecordset("Select * From LiqDetDescuentos Where NroRemito = '" & rsDetFact!NroRem & "'")
            Do While Not rsLiqDetDesc.EOF
                With TrsDescDet
                .AddNew
                .Fields("NroFact") = Text1
                .Fields("NroRemito") = rsLiqDetDesc!NroRemito
                .Fields("Efvo") = rsLiqDetDesc!Efvo
                .Fields("Gas-Oil") = rsLiqDetDesc.Fields("Gas-Oil")
                .Fields("Faltante") = rsLiqDetDesc!Faltante
                .Fields("NroLiq") = rsLiqDetDesc!NroLiq
                Set rsEncabLiq = db.OpenRecordset("Select * From EncabLiquidacion Where NroLiq = " & rsLiqDetDesc!NroLiq & "")
                .Fields("CodFlet") = rsEncabLiq!CodFlet
                Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabLiq!CodFlet & "")
                .Fields("DescFlet") = rsFleteros!DescFlet
                Set rsEncabLiq = Nothing
                Set rsFleteros = Nothing
                Set rsEncabFact = db.OpenRecordset("Select * From EncabFact Where NroFact = " & Text1 & "")
                Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!Codigo & "")
                .Fields("Codempresa") = rsEmpresas!codEmpresas
                .Fields("DescEmpresa") = rsEmpresas!DescEmpresas
                Set rsEncabFact = Nothing
                Set rsEmpresas = Nothing
                .Update
                End With
                rsLiqDetDesc.MoveNext
            Loop
            rsDetFact.MoveNext
        Loop
        Set rsDetFact = Nothing
        Set rsLiqDetDesc = Nothing
        Set TrsDescDet = Nothing
        frmRep.Show vbModal
    Else
        Set rsDetFactCta = db.OpenRecordset("Select * From DetFactCta Where NroFact = " & Text1 & "")
        Do While Not rsDetFactCta.EOF
            Set rsLiqDetDesc = db.OpenRecordset("Select * From LiqDetDescuentos Where NroRemito = '" & rsDetFactCta!NroRem & "'")
            Do While Not rsLiqDetDesc.EOF
                With TrsDescDet
                .AddNew
                .Fields("NroFact") = Text1
                .Fields("NroRemito") = rsLiqDetDesc!NroRemito
                .Fields("Efvo") = rsLiqDetDesc!Efvo
                .Fields("Gas-Oil") = rsLiqDetDesc.Fields("Gas-Oil")
                .Fields("Faltante") = rsLiqDetDesc!Faltante
                .Fields("NroLiq") = rsLiqDetDesc!NroLiq
                Set rsEncabLiq = db.OpenRecordset("Select * From EncabLiquidacion Where NroLiq = " & rsLiqDetDesc!NroLiq & "")
                .Fields("CodFlet") = rsEncabLiq!CodFlet
                Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabLiq!CodFlet & "")
                .Fields("DescFlet") = rsFleteros!DescFlet
                Set rsEncabLiq = Nothing
                Set rsFleteros = Nothing
                Set rsEncabFact = db.OpenRecordset("Select * From EncabFactCta Where NroFact = " & Text1 & "")
                Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabFact!Codigo & "")
                .Fields("Codempresa") = rsEmpresas!codEmpresas
                .Fields("DescEmpresa") = rsEmpresas!DescEmpresas
                Set rsEncabFactCta = Nothing
                Set rsEmpresas = Nothing
                .Update
                End With
                rsLiqDetDesc.MoveNext
            Loop
            rsDetFactCta.MoveNext
        Loop
        Set rsDetFactCta = Nothing
        Set rsLiqDetDesc = Nothing
        Set TrsDescDet = Nothing
        frmRep.Show vbModal
    End If
Else
    MsgBox "Debe ingresa un nro de factura", vbInformation
    Text1.SetFocus
End If
End Sub

Private Sub Option1_Click(Index As Integer)
If Index = 0 Then
    Option1(0).Value = True
    Option1(1).Value = False
Else
    Option1(0).Value = False
    Option1(1).Value = True
End If
End Sub
