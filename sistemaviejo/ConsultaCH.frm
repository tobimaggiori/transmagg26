VERSION 5.00
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Begin VB.Form ConsultaCH 
   BackColor       =   &H80000007&
   Caption         =   "Consulta Cheuqes Emitidos"
   ClientHeight    =   1905
   ClientLeft      =   120
   ClientTop       =   450
   ClientWidth     =   4965
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   1905
   ScaleWidth      =   4965
   Begin VB.ComboBox Combo1 
      Height          =   315
      Left            =   960
      TabIndex        =   5
      Text            =   "Combo1"
      Top             =   960
      Width           =   3855
   End
   Begin VB.CommandButton Consultar 
      Caption         =   "Consutar"
      Height          =   375
      Left            =   360
      TabIndex        =   4
      Top             =   1440
      Width           =   4215
   End
   Begin MSMask.MaskEdBox Fhasta 
      Height          =   255
      Left            =   3600
      TabIndex        =   1
      Top             =   360
      Width           =   1215
      _ExtentX        =   2143
      _ExtentY        =   450
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin MSMask.MaskEdBox Fdesde 
      Height          =   255
      Left            =   960
      TabIndex        =   0
      Top             =   360
      Width           =   1215
      _ExtentX        =   2143
      _ExtentY        =   450
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.Label Label3 
      BackColor       =   &H80000007&
      Caption         =   "Estado"
      ForeColor       =   &H0080FFFF&
      Height          =   255
      Left            =   0
      TabIndex        =   6
      Top             =   960
      Width           =   975
   End
   Begin VB.Label Label2 
      BackColor       =   &H80000007&
      Caption         =   "Hasta"
      ForeColor       =   &H0080FFFF&
      Height          =   255
      Left            =   2520
      TabIndex        =   3
      Top             =   360
      Width           =   975
   End
   Begin VB.Label Label1 
      BackColor       =   &H80000007&
      Caption         =   "Desde"
      ForeColor       =   &H0080FFFF&
      Height          =   255
      Left            =   120
      TabIndex        =   2
      Top             =   360
      Width           =   975
   End
End
Attribute VB_Name = "ConsultaCH"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Consultar_Click()
Set rsCHEmitidos = db.OpenRecordset("SELECT * FROM ChEmitidos WHERE FEmision BETWEEN # " + Format(Fdesde, "mm/dd/yyyy") + " # AND # " + Format(Fhasta, "mm/dd/yyyy") + " # AND Estado = '" & Combo1.Text & "' ORDER BY NroComp")
Set TrsConsultas = dbTemp.OpenRecordset("Select * From Consultas")
Do While Not TrsConsultas.EOF
    TrsConsultas.Delete
    TrsConsultas.MoveNext
Loop
TrsConsultas.AddNew
TrsConsultas.Fields("FDede") = Fdesde
TrsConsultas.Fields("FHasta") = Fhasta
TrsConsultas.Update
Set TrsCHEmitidos = dbTemp.OpenRecordset("Select * From ChEmitidos")
Do While Not TrsCHEmitidos.EOF
    TrsCHEmitidos.Delete
    TrsCHEmitidos.MoveNext
Loop
With TrsCHEmitidos
Do While Not rsCHEmitidos.EOF
    .AddNew
    .Fields("Fecha") = rsCHEmitidos!Fecha
    .Fields("CtaCte") = rsCHEmitidos!CtaCte
    .Fields("NroComp") = rsCHEmitidos!NroComp
    .Fields("Importe") = rsCHEmitidos!Haber
    .Fields("FEmision") = rsCHEmitidos!FEmision
    .Fields("Dado") = rsCHEmitidos!Dado
    .Update
    rsCHEmitidos.MoveNext
Loop
End With
Dim frmRep As New InfCHEmitidos
frmRep.Show vbModal

End Sub

Private Sub Fdesde_Validate(Cancel As Boolean)
If IsDate(Fdesde) = False Then
    MsgBox "Fecha Incorrecta"
    Fdesde.SetFocus
End If
End Sub

Private Sub Fhasta_Validate(Cancel As Boolean)
If Not IsDate(Fhasta) = False Then
    If Fhasta < Fdesde Then
        MsgBox "La fecha HASTA debe ser mayor a Fecha DESDE"
        Fhasta.SetFocus
        Exit Sub
    End If
Else
    MsgBox "Fecha incorrecta"
    Fhasta.SetFocus
End If
End Sub

Private Sub Form_Load()
Fdesde.Text = ""
Fdesde.Mask = ""
Fdesde.Mask = "##/##/####"
Fhasta.Text = ""
Fhasta.Mask = ""
Fhasta.Mask = "##/##/####"
Combo1.Clear
Combo1.AddItem ("Pendiente")
Combo1.AddItem ("Acreditado")
Combo1.ListIndex = 0

End Sub
