VERSION 5.00
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Begin VB.Form ConsSaldoHistoricos 
   Caption         =   "Consulta Saldos Historicos"
   ClientHeight    =   2190
   ClientLeft      =   60
   ClientTop       =   345
   ClientWidth     =   4290
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   2190
   ScaleWidth      =   4290
   Begin VB.CommandButton Command1 
      Caption         =   "Consultar"
      Height          =   375
      Left            =   600
      TabIndex        =   4
      Top             =   1560
      Width           =   3135
   End
   Begin MSMask.MaskEdBox FechaHasta 
      Height          =   375
      Left            =   2280
      TabIndex        =   3
      Top             =   360
      Width           =   1695
      _ExtentX        =   2990
      _ExtentY        =   661
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.OptionButton Option1 
      Caption         =   "Proveedores"
      Height          =   255
      Index           =   1
      Left            =   2280
      TabIndex        =   2
      Top             =   1080
      Width           =   1335
   End
   Begin VB.OptionButton Option1 
      Caption         =   "Empresas"
      Height          =   255
      Index           =   0
      Left            =   480
      TabIndex        =   1
      Top             =   1080
      Width           =   1335
   End
   Begin VB.Label Label1 
      Caption         =   "Hasta Fecha"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   12
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   255
      Left            =   360
      TabIndex        =   0
      Top             =   480
      Width           =   1815
   End
End
Attribute VB_Name = "ConsSaldoHistoricos"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
     
Private Sub Command1_Click()
If Option1(0).Value = True Then
    Call SaldosEmpresas
Else
    Call SaldoProveedores
End If
End Sub
Private Sub SaldosEmpresas()
Dim VSaldo As Double
Dim VsaldoInicial As Double
Dim VFDesde As Date
Dim VEmpresa As Double
If FechaHasta.Text = "__/__/____" Or FechaHasta = "__/__/____" Then
    MsgBox "Debe ingresar fecha de consulta"
    Exit Sub
End If
Set TrsHistoricos = dbTemp.OpenRecordset("Historicos")
Do While Not TrsHistoricos.EOF
    TrsHistoricos.Delete
    TrsHistoricos.MoveNext
Loop

VFDesde = FechaHasta
VSaldo = 0
VsaldoInicial = 0
'CALCULA SALDO INICIAL
Set rsCtaCteEmp = db.OpenRecordset("SELECT * FROM CtaCteEmp WHERE Fecha <= #" & Format(FechaHasta, "mm/dd/yyyy") & "# Order By CodEmp,Fecha")
VEmpresa = rsCtaCteEmp!CodEmp
Do While Not rsCtaCteEmp.EOF
    If VEmpresa = rsCtaCteEmp!CodEmp Then
        If Not rsCtaCteEmp!Debe = "" Then
            VsaldoInicial = VsaldoInicial + rsCtaCteEmp!Debe
        End If
        If Not rsCtaCteEmp!Haber = "" Then
            VsaldoInicial = VsaldoInicial - rsCtaCteEmp!Haber
        End If
        rsCtaCteEmp.MoveNext
    Else
        If FormatNumber(VsaldoInicial, 0) <> 0 Then
            TrsHistoricos.AddNew
            TrsHistoricos!Cod = VEmpresa
            Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas WHERE CodEmpresas = " & VEmpresa & "")
            TrsHistoricos!Descrip = rsEmpresas!DescEmpresas
            TrsHistoricos!Saldo = FormatNumber(VsaldoInicial)
            TrsHistoricos!Fecha = VFDesde
            TrsHistoricos.Update
        End If
        VEmpresa = rsCtaCteEmp!CodEmp
        VsaldoInicial = 0
    End If
Loop

Dim frmRep As New InfSaldosHistoricos
frmRep.Show vbModal
End Sub
Private Sub SaldoProveedores()
Dim VSaldo As Double
Dim VsaldoInicial As Double
Dim VFDesde As Date
Dim VEmpresa As Double
If FechaHasta.Text = "__/__/____" Or FechaHasta = "__/__/____" Then
    MsgBox "Debe ingresar fecha de consulta"
    Exit Sub
End If
Set TrsHistoricos = dbTemp.OpenRecordset("Historicos")
Do While Not TrsHistoricos.EOF
    TrsHistoricos.Delete
    TrsHistoricos.MoveNext
Loop

VFDesde = FechaHasta
VSaldo = 0
VsaldoInicial = 0
'CALCULA SALDO INICIAL
Set rsCtaCteEmp = db.OpenRecordset("SELECT * FROM CtaCteProv WHERE Fecha <= #" & Format(FechaHasta, "mm/dd/yyyy") & "# Order By CodProv,Fecha")
VEmpresa = rsCtaCteEmp!codprov
Do While Not rsCtaCteEmp.EOF
    If VEmpresa = rsCtaCteEmp!codprov Then
        If Not rsCtaCteEmp!Debe = "" Then
            VsaldoInicial = VsaldoInicial - rsCtaCteEmp!Debe
        End If
        If Not rsCtaCteEmp!Haber = "" Then
            VsaldoInicial = VsaldoInicial + rsCtaCteEmp!Haber
        End If
        rsCtaCteEmp.MoveNext
    Else
        If FormatNumber(VsaldoInicial, 0) <> 0 Then
            TrsHistoricos.AddNew
            TrsHistoricos!Cod = VEmpresa
            Set rsEmpresas = db.OpenRecordset("SELECT * FROM Fleteros WHERE CodFlet = " & VEmpresa & "")
            TrsHistoricos!Descrip = rsEmpresas!DescFlet
            TrsHistoricos!Saldo = FormatNumber(VsaldoInicial)
            TrsHistoricos!Fecha = VFDesde
            TrsHistoricos.Update
        End If
        VEmpresa = rsCtaCteEmp!codprov
        VsaldoInicial = 0
    End If
Loop

Dim frmRep As New InfSaldosHistoricoFleteros
frmRep.Show vbModal

End Sub

Private Sub Form_Load()
FechaHasta.Mask = ""
FechaHasta.Text = ""
FechaHasta.Mask = "##/##/####"

End Sub

Private Sub Option1_Click(Index As Integer)
If Index = 0 Then
    Option1(1).Value = False
Else
    Option1(0).Value = False
End If

End Sub
