VERSION 5.00
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Begin VB.Form SaldosEmpresas 
   BackColor       =   &H80000007&
   Caption         =   "Consulta de Saldo por Empresas"
   ClientHeight    =   5490
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   9030
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   5490
   ScaleWidth      =   9030
   Begin VB.CommandButton Command1 
      Caption         =   "Cosnultar"
      Height          =   495
      Left            =   2040
      TabIndex        =   17
      Top             =   4920
      Width           =   5295
   End
   Begin VB.Frame Frame1 
      BackColor       =   &H00000000&
      Caption         =   "Tipo de Consulta"
      ForeColor       =   &H000080FF&
      Height          =   3615
      Left            =   360
      TabIndex        =   3
      Top             =   120
      Width           =   8415
      Begin MSMask.MaskEdBox FHASTA 
         Height          =   255
         Left            =   4680
         TabIndex        =   19
         Top             =   720
         Width           =   1215
         _ExtentX        =   2143
         _ExtentY        =   450
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin VB.Frame Frame2 
         BackColor       =   &H00000000&
         Height          =   1095
         Index           =   0
         Left            =   720
         TabIndex        =   10
         Top             =   2280
         Width           =   6375
         Begin VB.TextBox Text1 
            Height          =   285
            Index           =   2
            Left            =   1080
            TabIndex        =   12
            Text            =   "Text1"
            Top             =   600
            Width           =   855
         End
         Begin VB.TextBox Text1 
            Height          =   285
            Index           =   1
            Left            =   1080
            TabIndex        =   11
            Text            =   "Text1"
            Top             =   240
            Width           =   855
         End
         Begin VB.Label Label2 
            BackColor       =   &H80000012&
            Caption         =   "Hasta"
            ForeColor       =   &H000080FF&
            Height          =   255
            Index           =   1
            Left            =   360
            TabIndex        =   16
            Top             =   600
            Width           =   615
         End
         Begin VB.Label Label1 
            BorderStyle     =   1  'Fixed Single
            Caption         =   "Label1"
            Height          =   285
            Index           =   2
            Left            =   2040
            TabIndex        =   15
            Top             =   600
            Width           =   3975
         End
         Begin VB.Label Label1 
            BorderStyle     =   1  'Fixed Single
            Caption         =   "Label1"
            Height          =   285
            Index           =   1
            Left            =   2040
            TabIndex        =   14
            Top             =   240
            Width           =   3975
         End
         Begin VB.Label Label2 
            BackColor       =   &H80000012&
            Caption         =   "Desde"
            ForeColor       =   &H000080FF&
            Height          =   255
            Index           =   0
            Left            =   360
            TabIndex        =   13
            Top             =   240
            Width           =   615
         End
      End
      Begin VB.Frame Frame3 
         BackColor       =   &H00000000&
         Height          =   735
         Left            =   720
         TabIndex        =   7
         Top             =   1080
         Width           =   6375
         Begin VB.TextBox Text1 
            Height          =   285
            Index           =   0
            Left            =   240
            TabIndex        =   8
            Text            =   "Text1"
            Top             =   240
            Width           =   855
         End
         Begin VB.Label Label1 
            BorderStyle     =   1  'Fixed Single
            Caption         =   "Label1"
            Height          =   285
            Index           =   0
            Left            =   1200
            TabIndex        =   9
            Top             =   240
            Width           =   3975
         End
      End
      Begin VB.OptionButton op 
         BackColor       =   &H00000000&
         Caption         =   "Rango de Clientes"
         ForeColor       =   &H000080FF&
         Height          =   255
         Index           =   2
         Left            =   360
         TabIndex        =   6
         Top             =   1920
         Width           =   2175
      End
      Begin VB.OptionButton op 
         BackColor       =   &H00000000&
         Caption         =   "Un Cliente"
         ForeColor       =   &H000080FF&
         Height          =   255
         Index           =   1
         Left            =   360
         TabIndex        =   5
         Top             =   720
         Width           =   2175
      End
      Begin VB.OptionButton op 
         BackColor       =   &H00000000&
         Caption         =   "Todos los Clientes"
         ForeColor       =   &H000080FF&
         Height          =   255
         Index           =   0
         Left            =   360
         TabIndex        =   4
         Top             =   360
         Width           =   2175
      End
      Begin MSMask.MaskEdBox FDESDE 
         Height          =   255
         Left            =   4680
         TabIndex        =   21
         Top             =   240
         Width           =   1215
         _ExtentX        =   2143
         _ExtentY        =   450
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin VB.Label Label2 
         BackColor       =   &H80000012&
         Caption         =   "Fecha Desde"
         ForeColor       =   &H000080FF&
         Height          =   255
         Index           =   3
         Left            =   3480
         TabIndex        =   20
         Top             =   240
         Width           =   1095
      End
      Begin VB.Label Label2 
         BackColor       =   &H80000012&
         Caption         =   "Fecha Hasta"
         ForeColor       =   &H000080FF&
         Height          =   255
         Index           =   2
         Left            =   3480
         TabIndex        =   18
         Top             =   720
         Width           =   1095
      End
   End
   Begin VB.Frame Frame4 
      BackColor       =   &H80000007&
      Caption         =   "Orden"
      ForeColor       =   &H000080FF&
      Height          =   975
      Left            =   360
      TabIndex        =   0
      Top             =   3840
      Width           =   8415
      Begin VB.OptionButton op1 
         BackColor       =   &H80000007&
         Caption         =   "Codigo"
         ForeColor       =   &H000080FF&
         Height          =   255
         Index           =   0
         Left            =   1920
         MaskColor       =   &H000080FF&
         TabIndex        =   2
         Top             =   360
         Width           =   2055
      End
      Begin VB.OptionButton op1 
         BackColor       =   &H80000007&
         Caption         =   "Razon Social"
         Enabled         =   0   'False
         ForeColor       =   &H000080FF&
         Height          =   255
         Index           =   1
         Left            =   5400
         MaskColor       =   &H000080FF&
         TabIndex        =   1
         Top             =   360
         Width           =   2055
      End
   End
End
Attribute VB_Name = "SaldosEmpresas"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Command1_Click()
Dim Sql As String
Sql = ""
If op(0).Value = True Then
    If FHasta = "__/__/____" Then
        Sql = Sql
    Else
        Sql = Sql + "Where Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " # "
    End If
ElseIf op(1).Value = True Then
    If FHasta = "__/__/____" Then
        Sql = Sql + "WHERE CodEmp = " & Text1(0) & " "
    Else
        Sql = Sql + "WHERE CodEmp = " & Text1(0) & " and Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " # "
    End If
Else
    If FHasta = "__/__/____" Then
        Sql = Sql + "WHERE CodEmp BETWEEN " & Text1(1) & " AND " & Text1(2) & " "
    Else
        Sql = Sql + "WHERE CodEmp BETWEEN " & Text1(1) & " AND " & Text1(2) & " and Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " # "
    End If
End If
If op1(0).Value = True Then
    Sql = Sql + "ORDER BY CodEmp"
Else
    Sql = Sql + "ORDER BY RazonSocial"
End If
 If (Not (rsTSaldoVentas.EOF And rsTSaldoVentas.BOF)) Then
    rsTSaldoVentas.MoveFirst
    Do While Not rsTSaldoVentas.EOF
        rsTSaldoVentas.Delete
        rsTSaldoVentas.MoveNext
    Loop
End If
Dim i As Double
i = 0
Set rsCtaCteCli = db.OpenRecordset("SELECT * FROM CtaCteEmp " & Sql & "", 2)
Do While Not rsCtaCteCli.EOF
    If Not rsCtaCteCli!SaldoComp = 0 Then
        With rsTSaldoVentas
            .AddNew
            .Fields("CodEmpresa") = rsCtaCteCli!CodEmp
            Criterio = "CodEmpresas = " & rsCtaCteCli!CodEmp
            rsEmpresas.FindFirst Criterio
            .Fields("RazonSocial") = rsEmpresas!DescEmpresas
            .Fields("Fecha") = rsCtaCteCli!Fecha
            .Fields("CodComp") = rsCtaCteCli!TipoComp
            Criterio = "CodComp = " & rsCtaCteCli!TipoComp & ""
            rsComprobantes.FindFirst Criterio
            .Fields("DescComp") = rsComprobantes!DescComp
            .Fields("NroComp") = rsCtaCteCli!NroComp
            If Not rsCtaCteCli!Debe = "" Then
                .Fields("ImpComp") = rsCtaCteCli!Debe
                .Fields("SaldoComp") = rsCtaCteCli!SaldoComp
            Else
                .Fields("ImpComp") = rsCtaCteCli!Haber * -1
                .Fields("SaldoComp") = rsCtaCteCli!SaldoComp * -1
            End If
            .Update
        End With
    End If
    rsCtaCteCli.MoveNext
Loop
Dim frmRep As New InfSaldosVentas
frmRep.Show vbModal
End Sub

Private Sub Form_Initialize()
Set rsCtaCteCli = Nothing
Set rsEmpresas = Nothing
Set rsTSaldoVentas = Nothing
Set rsComprobantes = Nothing
End Sub

Private Sub Form_Load()
Set rsCtaCteCli = db.OpenRecordset("CtaCteEmp", 2)
Set rsEmpresas = db.OpenRecordset("Empresas", 2)
Set rsTSaldoVentas = dbTemp.OpenRecordset("TSaldosVentas", 2)
Set rsComprobantes = db.OpenRecordset("Comprobantes", 2)
i = o
For i = i + 1 To Label1.Count
    Label1(i - 1).Caption = ""
Next
i = 0
For i = i + 1 To Text1.Count
    Text1(i - 1) = ""
Next
op(0).Value = True
op1(0).Value = True
FHasta.Mask = ""
FHasta.Text = ""
FHasta.Mask = "##/##/####"
FDesde.Mask = ""
FDesde.Text = ""
FDesde.Mask = "##/##/####"

End Sub

Private Sub Option_Click(Index As Integer)
If op(0).Value = True Then
    op(1).Value = False
    op(2).Value = False
ElseIf op(1).Value = True Then
    op(0).Value = False
    op(2).Value = False
Else
    op(0).Value = False
    op(1).Value = False
End If

End Sub

Private Sub op1_Click(Index As Integer)
If Index = 0 Then
    op1(1).Value = False
Else
    op1(0).Value = False
End If
End Sub

Private Sub Text1_LostFocus(Index As Integer)
If Index = 0 Then
    If Text1(0).Text = "" Then
        'With BuscEmpresas
         '   .Show
          '  .Height = 6015
          '  .Width = 6225
           ' .Top = (Screen.Height - .Height) / 2
           ' .Left = (Screen.Width - .Width) / 2
           ' .Viene = "CS_UNO"
        'End With
    Else
        Criterio = "CodEmpresas = '" & Text1(0) & "'"
        Set rsEmpresas = db.OpenRecordset("Select * FRom Empresas Where CodEmpresas = " & Text1(0) & "")
        'rsEmpresas.FindFirst Criterio
        If Not rsEmpresas.NoMatch Then
            Label1(0).Caption = rsEmpresas!DescEmpresas
        Else
            MsgBox "El cliente no existe"
            Text1(0).SetFocus
        End If
    End If
ElseIf Index = 1 Then
    If Text1(1).Text = "" Then
       ' With BuscEmpresas
        '    .Show
        '    .Height = 6015
        '    .Width = 6225
        '    .Top = (Screen.Height - .Height) / 2
        '    .Left = (Screen.Width - .Width) / 2
        '    .Viene = "CS_RDESDE"
        'End With
    Else
        Criterio = "CodEmpresas = " & Text1(1) & ""
        rsEmpresas.FindFirst Criterio
        If Not rsEmpresas.NoMatch Then
            Label1(1).Caption = rsEmpresas!DescEmpresas
        Else
            MsgBox "El cliente no existe"
            Text1(1).SetFocus
        End If
    End If
Else
    If Text1(2).Text = "" Then
       ' With BuscEmpresas
        '    .Show
        '    .Height = 6015
        '    .Width = 6225
        '    .Top = (Screen.Height - .Height) / 2
        '    .Left = (Screen.Width - .Width) / 2
        '    .Viene = "CS_RHASTA"
       ' End With
    Else
        Criterio = "CodEmpresas = " & Text1(2) & ""
        rsEmpresas.FindFirst Criterio
        If Not rsEmpresas.NoMatch Then
            Label1(2).Caption = rsEmpresas!DescEmpresas
        Else
            MsgBox "El cliente no existe"
            Text1(2).SetFocus
        End If
    End If
End If

End Sub

