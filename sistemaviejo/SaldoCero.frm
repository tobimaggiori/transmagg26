VERSION 5.00
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Begin VB.Form SaldoCero 
   Caption         =   "Saldo Cero"
   ClientHeight    =   2415
   ClientLeft      =   60
   ClientTop       =   345
   ClientWidth     =   4680
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   2415
   ScaleWidth      =   4680
   Begin MSMask.MaskEdBox FechaHasta 
      Height          =   375
      Left            =   1800
      TabIndex        =   3
      Top             =   960
      Width           =   2055
      _ExtentX        =   3625
      _ExtentY        =   661
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.OptionButton Option1 
      Caption         =   "Proveedores"
      Height          =   255
      Index           =   1
      Left            =   2520
      TabIndex        =   2
      Top             =   360
      Width           =   1455
   End
   Begin VB.OptionButton Option1 
      Caption         =   "Empresas"
      Height          =   255
      Index           =   0
      Left            =   360
      TabIndex        =   1
      Top             =   360
      Width           =   1455
   End
   Begin VB.CommandButton Command1 
      Caption         =   "Command1"
      Height          =   495
      Left            =   840
      TabIndex        =   0
      Top             =   1680
      Width           =   2535
   End
   Begin VB.Label Label1 
      Caption         =   "Fecha"
      Height          =   255
      Left            =   240
      TabIndex        =   4
      Top             =   1080
      Width           =   1335
   End
End
Attribute VB_Name = "SaldoCero"
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


Set rsSaldoCero = db.OpenRecordset("SaldoCero")

VFDesde = FechaHasta
VSaldo = 0
VsaldoInicial = 0
Do While Not rsSaldoCero.EOF
    'CALCULA SALDO INICIAL
    VsaldoInicial = 0
    Set rsCtaCteEmp = db.OpenRecordset("SELECT * FROM CtaCteEmp WHERE CodEmp = " & rsSaldoCero!Cod & " AND Fecha <= #" & Format(FechaHasta, "mm/dd/yyyy") & "# Order By CodEmp,Fecha")
    Do While Not rsCtaCteEmp.EOF
   
            If Not rsCtaCteEmp!Debe = "" Then
                VsaldoInicial = VsaldoInicial + rsCtaCteEmp!Debe
            End If
            If Not rsCtaCteEmp!Haber = "" Then
                VsaldoInicial = VsaldoInicial - rsCtaCteEmp!Haber
            End If
            rsCtaCteEmp.MoveNext
    Loop
    
    If VsaldoInicial < 0 Then
        rsCtaCteEmp.AddNew
        rsCtaCteEmp.Fields("Fecha") = FechaHasta
        rsCtaCteEmp.Fields("CodEmp") = rsSaldoCero!Cod
        rsCtaCteEmp.Fields("PtoVta") = 1
        rsCtaCteEmp.Fields("NroComp") = 999
        rsCtaCteEmp.Fields("TipoComp") = 1
        rsCtaCteEmp.Fields("Debe") = VsaldoInicial * -1
        rsCtaCteEmp.Fields("SaldoComp") = 0
        rsCtaCteEmp.Update
    Else
        rsCtaCteEmp.AddNew
        rsCtaCteEmp.Fields("Fecha") = FechaHasta
        rsCtaCteEmp.Fields("CodEmp") = rsSaldoCero!Cod
        rsCtaCteEmp.Fields("PtoVta") = 1
        rsCtaCteEmp.Fields("NroComp") = 999
        rsCtaCteEmp.Fields("TipoComp") = 1
        rsCtaCteEmp.Fields("Haber") = VsaldoInicial
        rsCtaCteEmp.Fields("SaldoComp") = 0
        rsCtaCteEmp.Update
    
    End If
    rsSaldoCero.MoveNext
Loop

End Sub
Private Sub SaldoProveedores()
Dim VSaldo As Double
Dim VsaldoInicial As Double
Dim VFDesde As Date
Dim VEmpresa As Double


Set rsSaldoCero = db.OpenRecordset("SaldoCero")

VFDesde = FechaHasta
VSaldo = 0
VsaldoInicial = 0
Do While Not rsSaldoCero.EOF
    'CALCULA SALDO INICIAL
    VsaldoInicial = 0
    Set rsCtaCteEmp = db.OpenRecordset("SELECT * FROM CtaCteProv WHERE CodProv = " & rsSaldoCero!Cod & " AND Fecha <= #" & Format(FechaHasta, "mm/dd/yyyy") & "# Order By Fecha")
    Do While Not rsCtaCteEmp.EOF

            If Not rsCtaCteEmp!Debe = "" Then
                VsaldoInicial = VsaldoInicial - rsCtaCteEmp!Debe
            End If
            If Not rsCtaCteEmp!Haber = "" Then
                VsaldoInicial = VsaldoInicial + rsCtaCteEmp!Haber
            End If
            rsCtaCteEmp.MoveNext
    Loop
    
    If VsaldoInicial < 0 Then
        rsCtaCteEmp.AddNew
        rsCtaCteEmp.Fields("Fecha") = FechaHasta
        rsCtaCteEmp.Fields("CodProv") = rsSaldoCero!Cod
        rsCtaCteEmp.Fields("PtoVta") = 1
        rsCtaCteEmp.Fields("NroComp") = 999
        rsCtaCteEmp.Fields("TipoComp") = 1
        rsCtaCteEmp.Fields("Haber") = VsaldoInicial * -1
        rsCtaCteEmp.Fields("SaldoComp") = 0
        rsCtaCteEmp.Update
    Else
        rsCtaCteEmp.AddNew
        rsCtaCteEmp.Fields("Fecha") = FechaHasta
        rsCtaCteEmp.Fields("CodProv") = rsSaldoCero!Cod
        rsCtaCteEmp.Fields("PtoVta") = 1
        rsCtaCteEmp.Fields("NroComp") = 999
        rsCtaCteEmp.Fields("TipoComp") = 1
        rsCtaCteEmp.Fields("Debe") = VsaldoInicial
        rsCtaCteEmp.Fields("SaldoComp") = 0
        rsCtaCteEmp.Update
    
    End If
    rsSaldoCero.MoveNext
Loop

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
