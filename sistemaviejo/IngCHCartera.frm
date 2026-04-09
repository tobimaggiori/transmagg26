VERSION 5.00
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Begin VB.Form IngCHCartera 
   BackColor       =   &H80000007&
   Caption         =   "Ingreso de Cheques a Cartera"
   ClientHeight    =   2310
   ClientLeft      =   60
   ClientTop       =   420
   ClientWidth     =   7665
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   2310
   ScaleWidth      =   7665
   Begin VB.CommandButton Grabar 
      Caption         =   "Grabar"
      Height          =   495
      Left            =   2160
      TabIndex        =   11
      Top             =   1560
      Width           =   2895
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   960
      TabIndex        =   0
      Text            =   "Text1"
      Top             =   240
      Width           =   975
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   6360
      TabIndex        =   3
      Text            =   "Text1"
      Top             =   720
      Width           =   1095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   6
      Left            =   3720
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   720
      Width           =   1335
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   7
      Left            =   1200
      TabIndex        =   4
      Text            =   "Text1"
      Top             =   1080
      Width           =   6255
   End
   Begin MSMask.MaskEdBox Fecha 
      Height          =   285
      Left            =   960
      TabIndex        =   1
      Top             =   720
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.Label Label1 
      BackColor       =   &H8000000E&
      BorderStyle     =   1  'Fixed Single
      Caption         =   "Label1"
      Height          =   285
      Left            =   2040
      TabIndex        =   10
      Top             =   240
      Width           =   5415
   End
   Begin VB.Label Label2 
      BackColor       =   &H80000007&
      Caption         =   "Cuenta"
      ForeColor       =   &H000080FF&
      Height          =   255
      Left            =   0
      TabIndex        =   9
      Top             =   240
      Width           =   855
   End
   Begin VB.Label Label5 
      BackColor       =   &H80000007&
      Caption         =   "Importe"
      ForeColor       =   &H000080FF&
      Height          =   255
      Left            =   5280
      TabIndex        =   8
      Top             =   720
      Width           =   855
   End
   Begin VB.Label Label3 
      BackColor       =   &H80000007&
      Caption         =   "Fecha"
      ForeColor       =   &H000080FF&
      Height          =   255
      Index           =   0
      Left            =   0
      TabIndex        =   7
      Top             =   720
      Width           =   855
   End
   Begin VB.Label Label14 
      BackColor       =   &H80000007&
      Caption         =   "Nro Comp"
      ForeColor       =   &H000080FF&
      Height          =   255
      Left            =   2400
      TabIndex        =   6
      Top             =   720
      Width           =   1215
   End
   Begin VB.Label Label3 
      BackColor       =   &H80000007&
      Caption         =   "Observaciones"
      ForeColor       =   &H000080FF&
      Height          =   255
      Index           =   1
      Left            =   0
      TabIndex        =   5
      Top             =   1080
      Width           =   1095
   End
End
Attribute VB_Name = "IngCHCartera"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Command1_Click()
Dim VALOR As Integer
End Sub

Private Sub Form_Load()
Text1(0) = ""
Text1(1) = "0.00"
Text1(6) = ""
Text1(7) = ""
Label1.Caption = ""
Fecha.Mask = ""
Fecha.Text = ""
Fecha.Mask = "##/##/####"

End Sub

Private Sub Grabar_Click()
Set rsCtaCteBco = Nothing
Set rsDetMovBco = Nothing
Set rsCtaCteBco = db.OpenRecordset("CtaCteBco")
Set rsDetMovBco = db.OpenRecordset("DetMovBco")
Set rsAsientos = db.OpenRecordset("Asientos")
Set rsCHEmitidos = db.OpenRecordset("ChEmitidos")
With rsCHEmitidos
    .AddNew
    .Fields("Fecha") = Fecha
    .Fields("CtaCte") = Text1(0)
    .Fields("CodComp") = 1
    .Fields("NroComp") = Text1(6)
    '.Fields("NroMov") = lPrimaryKey
    .Fields("Haber") = FormatNumber(Text1(1))
    .Fields("Estado") = "Pendiente"
    .Fields("FEmision") = Date
    .Fields("Dado") = Text1(7)
    .Update
End With
'graba detalle del comprobante
With rsDetMovBco
    .AddNew
    .Fields("NroMov") = Text1(6)
    .Fields("TipoMov") = "Mutuo"
    .Fields("CodMov") = 3
    .Fields("Efvo") = Text1(1)
     .Update
End With
Set rsChTer = db.OpenRecordset("ChequesTerc")
With rsChTer
    .AddNew
    .Fields("CodBanco") = "11"
    .Fields("NroCh") = Text1(6)
    .Fields("FechaVto") = Fecha
    .Fields("Importe") = FormatNumber(Text1(1))
    .Fields("Entregado") = "Propio"
    .Fields("Estado") = "En Cartera"
    '.Fields("NroRec") = lPrimaryKey
    .Update
End With
MsgBox "Se agrego correctamente"
Text1(0) = ""
Text1(1) = "0.00"
Text1(6) = ""
Text1(7) = ""
Label1.Caption = ""
Fecha.Mask = ""
Fecha.Text = ""
Fecha.Mask = "##/##/####"

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
    Else
        MsgBox "La Cuenta no exsiste"
        Text1(0) = ""
        Text1(0).SetFocus
        Exit Sub
    End If
    End If
End Select

End Sub
