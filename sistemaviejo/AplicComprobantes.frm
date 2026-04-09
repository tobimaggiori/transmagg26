VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form AplicComprobantes 
   BackColor       =   &H80000007&
   Caption         =   "Aplicar Comprobantes"
   ClientHeight    =   9105
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   14220
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   9105
   ScaleWidth      =   14220
   Begin VB.Frame Frame4 
      BackColor       =   &H80000007&
      Caption         =   "Aplicacion de Comprobante"
      ForeColor       =   &H8000000E&
      Height          =   1215
      Left            =   240
      TabIndex        =   10
      Top             =   7440
      Width           =   13815
      Begin VB.CommandButton Command2 
         Caption         =   "Aplicar"
         Height          =   615
         Left            =   10920
         TabIndex        =   23
         Top             =   360
         Width           =   1815
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   1
         Left            =   9240
         TabIndex        =   22
         Top             =   720
         Width           =   1095
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   0
         Left            =   9240
         TabIndex        =   21
         Top             =   360
         Width           =   1095
      End
      Begin VB.Label Label2 
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   11
         Left            =   7920
         TabIndex        =   25
         Top             =   720
         Width           =   975
      End
      Begin VB.Label Label2 
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   10
         Left            =   6840
         TabIndex        =   24
         Top             =   720
         Width           =   975
      End
      Begin VB.Label Label2 
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   9
         Left            =   3000
         TabIndex        =   20
         Top             =   720
         Width           =   3735
      End
      Begin VB.Label Label2 
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   8
         Left            =   2400
         TabIndex        =   19
         Top             =   720
         Width           =   495
      End
      Begin VB.Label Label2 
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   7
         Left            =   1320
         TabIndex        =   18
         Top             =   720
         Width           =   975
      End
      Begin VB.Label Label2 
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   6
         Left            =   240
         TabIndex        =   17
         Top             =   720
         Width           =   975
      End
      Begin VB.Label Label2 
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   5
         Left            =   7920
         TabIndex        =   16
         Top             =   360
         Width           =   975
      End
      Begin VB.Label Label2 
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   4
         Left            =   6840
         TabIndex        =   15
         Top             =   360
         Width           =   975
      End
      Begin VB.Label Label2 
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   3
         Left            =   3000
         TabIndex        =   14
         Top             =   360
         Width           =   3735
      End
      Begin VB.Label Label2 
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   2
         Left            =   2400
         TabIndex        =   13
         Top             =   360
         Width           =   495
      End
      Begin VB.Label Label2 
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   1
         Left            =   1320
         TabIndex        =   12
         Top             =   360
         Width           =   975
      End
      Begin VB.Label Label2 
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   0
         Left            =   240
         TabIndex        =   11
         Top             =   360
         Width           =   975
      End
   End
   Begin VB.Frame Frame3 
      BackColor       =   &H80000007&
      Caption         =   "Recibos de Pago"
      ForeColor       =   &H8000000E&
      Height          =   3495
      Left            =   7200
      TabIndex        =   8
      Top             =   3840
      Width           =   6855
      Begin MSComctlLib.ListView Recibos 
         Height          =   3015
         Left            =   120
         TabIndex        =   9
         Top             =   240
         Width           =   6600
         _ExtentX        =   11642
         _ExtentY        =   5318
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         GridLines       =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   6
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Nro"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "CodComp"
            Object.Width           =   882
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Descripción"
            Object.Width           =   3528
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Importe"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Saldo"
            Object.Width           =   1764
         EndProperty
      End
   End
   Begin VB.Frame Frame2 
      BackColor       =   &H80000007&
      Caption         =   "Notas de Créditos"
      ForeColor       =   &H8000000E&
      Height          =   3015
      Left            =   7200
      TabIndex        =   6
      Top             =   720
      Width           =   6855
      Begin MSComctlLib.ListView NCPendientes 
         Height          =   2655
         Left            =   120
         TabIndex        =   7
         Top             =   240
         Width           =   6600
         _ExtentX        =   11642
         _ExtentY        =   4683
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         GridLines       =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   6
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Key             =   " "
            Text            =   "Fecha"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Nro "
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "CodComp"
            Object.Width           =   882
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Descripcion"
            Object.Width           =   3528
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Importe"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Saldo"
            Object.Width           =   1764
         EndProperty
      End
   End
   Begin VB.Frame Frame1 
      BackColor       =   &H80000007&
      Caption         =   "Facturas con saldo pendiente"
      ForeColor       =   &H8000000E&
      Height          =   6615
      Left            =   240
      TabIndex        =   4
      Top             =   720
      Width           =   6855
      Begin MSComctlLib.ListView FactPendientes 
         Height          =   6135
         Left            =   120
         TabIndex        =   5
         Top             =   240
         Width           =   6600
         _ExtentX        =   11642
         _ExtentY        =   10821
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         GridLines       =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   6
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Nro Comp"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "CodComp"
            Object.Width           =   882
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Descripcion"
            Object.Width           =   3528
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Importe"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Saldo"
            Object.Width           =   1764
         EndProperty
      End
   End
   Begin VB.CommandButton Command1 
      Caption         =   "Buscar"
      Height          =   255
      Left            =   8640
      TabIndex        =   3
      Top             =   240
      Width           =   1815
   End
   Begin VB.TextBox CodEmpresa 
      Height          =   285
      Left            =   1560
      TabIndex        =   0
      Top             =   240
      Width           =   975
   End
   Begin VB.Label Label1 
      BackColor       =   &H80000007&
      Caption         =   "Empresa"
      ForeColor       =   &H8000000E&
      Height          =   255
      Left            =   240
      TabIndex        =   2
      Top             =   240
      Width           =   1215
   End
   Begin VB.Label DescEmpresa 
      BorderStyle     =   1  'Fixed Single
      Height          =   285
      Left            =   2640
      TabIndex        =   1
      Top             =   240
      Width           =   5535
   End
End
Attribute VB_Name = "AplicComprobantes"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub CodEmpresa_LostFocus()
Dim x As ListItem
If Not CodEmpresa = "" Then
    FactPendientes.ListItems.Clear
    NCPendientes.ListItems.Clear
    Recibos.ListItems.Clear
    Criterio = "CodEmpresas = " & CodEmpresa & ""
    rsEmpresas.FindFirst (Criterio)
    If Not rsEmpresas.NoMatch Then
        DescEmpresa.Caption = rsEmpresas!DescEmpresas
        Set rsCtaCteEmp = db.OpenRecordset("SELECT * FROM CtaCteEmp WHERE CodEmp = " & CodEmpresa & "")
        Do While Not rsCtaCteEmp.EOF
            If rsCtaCteEmp!TipoComp = 1 Or rsCtaCteEmp!TipoComp = 60 Or rsCtaCteEmp!TipoComp = 3 Or rsCtaCteEmp!TipoComp = 13 Or rsCtaCteEmp!TipoComp = 16 Or rsCtaCteEmp!TipoComp = 18 Or rsCtaCteEmp!TipoComp = 201 Or rsCtaCteEmp!TipoComp = 202 Then
                If rsCtaCteEmp!SaldoComp > 0 Then
                    Set x = FactPendientes.ListItems.Add(, , rsCtaCteEmp!Fecha)
                    x.Tag = rsCtaCteEmp!Fecha
                    x.SubItems(1) = rsCtaCteEmp!NroComp
                    x.SubItems(2) = rsCtaCteEmp!TipoComp
                    Criterio = "CodComp = " & rsCtaCteEmp!TipoComp & ""
                    rsComprobantes.FindFirst (Criterio)
                    x.SubItems(3) = rsComprobantes!DescComp
                    x.SubItems(4) = rsCtaCteEmp!Debe
                    x.SubItems(5) = rsCtaCteEmp!SaldoComp
                End If
            ElseIf rsCtaCteEmp!TipoComp = 6 Then
                If rsCtaCteEmp!SaldoComp > 0 Then
                    Set x = Recibos.ListItems.Add(, , rsCtaCteEmp!Fecha)
                    x.Tag = rsCtaCteEmp!Fecha
                    x.SubItems(1) = rsCtaCteEmp!NroComp
                    x.SubItems(2) = rsCtaCteEmp!TipoComp
                    Criterio = "CodComp = " & rsCtaCteEmp!TipoComp & ""
                    rsComprobantes.FindFirst (Criterio)
                    x.SubItems(3) = rsComprobantes!DescComp
                    x.SubItems(4) = rsCtaCteEmp!Haber
                    x.SubItems(5) = rsCtaCteEmp!SaldoComp
                End If
            Else
                If rsCtaCteEmp!TipoComp = 2 Or rsCtaCteEmp!TipoComp = 14 Or rsCtaCteEmp!TipoComp = 17 Or rsCtaCteEmp!TipoComp = 203 Then
                    If rsCtaCteEmp!SaldoComp > 0 Then
                        Set x = NCPendientes.ListItems.Add(, , rsCtaCteEmp!Fecha)
                        x.Tag = rsCtaCteEmp!Fecha
                        x.SubItems(1) = rsCtaCteEmp!NroComp
                        x.SubItems(2) = rsCtaCteEmp!TipoComp
                        Criterio = "CodComp = " & rsCtaCteEmp!TipoComp & ""
                        rsComprobantes.FindFirst (Criterio)
                        x.SubItems(3) = rsComprobantes!DescComp
                        x.SubItems(4) = rsCtaCteEmp!Haber
                        x.SubItems(5) = rsCtaCteEmp!SaldoComp
                    End If
                End If
            End If
            rsCtaCteEmp.MoveNext
        Loop
    Else
        MsgBox "La empresas no existe"
        CodEmpresa.SetFocus
    End If
End If
End Sub

Private Sub Command1_Click()
BuscEmpresa.Show: BuscEmpresa.Viene = "AplicComp"
End Sub

Private Sub Command2_Click()
Dim VImpFact As Long, VImpAplic As Long
VImpFact = Text1(0): VImpAplic = Text1(1)
If VImpFact >= VImpAplic Then
    'actuliza saldo de la FC o ND
    Criterio = "CodEmp = " & CodEmpresa & " AND TipoComp = " & Label2(2) & " AND NroComp = " & Label2(1) & ""
    rsCtaCteEmp.FindFirst (Criterio)
    rsCtaCteEmp.LockEdits = True
    rsCtaCteEmp.Edit
    rsCtaCteEmp!SaldoComp = Label2(5) - Text1(1)
    rsCtaCteEmp.Update
    rsCtaCteEmp.LockEdits = False
    'Actualiza saldo del REC o NC
    Criterio = "CodEmp = " & CodEmpresa & " AND TipoComp = " & Label2(8) & " AND NroComp = " & Label2(7) & ""
    rsCtaCteEmp.FindFirst (Criterio)
    rsCtaCteEmp.LockEdits = True
    rsCtaCteEmp.Edit
    rsCtaCteEmp!SaldoComp = Label2(11) - Text1(1)
    rsCtaCteEmp.Update
    rsCtaCteEmp.LockEdits = False
    'aplica recibo
    Set rsAplicRec = db.OpenRecordset("AplicRec")
    With rsAplicRec
        .AddNew
        .Fields("NroRec") = Label2(7)
        .Fields("NroFact") = Label2(1)
        .Fields("PtoVta") = 1
        .Fields("ImpAplic") = Text1(1)
        .Update
    End With
    FactPendientes.ListItems.Clear
    NCPendientes.ListItems.Clear
    Recibos.ListItems.Clear
    Criterio = "CodEmpresas = " & CodEmpresa & ""
    rsEmpresas.FindFirst (Criterio)
    If Not rsEmpresas.NoMatch Then
        DescEmpresa.Caption = rsEmpresas!DescEmpresas
        Set rsCtaCteEmp = db.OpenRecordset("SELECT * FROM CtaCteEmp WHERE CodEmp = " & CodEmpresa & "")
        Do While Not rsCtaCteEmp.EOF
            If rsCtaCteEmp!TipoComp = 1 Or rsCtaCteEmp!TipoComp = 3 Or rsCtaCteEmp!TipoComp = 60 Or rsCtaCteEmp!TipoComp = 13 Or rsCtaCteEmp!TipoComp = 16 Or rsCtaCteEmp!TipoComp = 201 Or rsCtaCteEmp!TipoComp = 202 Then
                If rsCtaCteEmp!SaldoComp > 0 Then
                    Set x = FactPendientes.ListItems.Add(, , rsCtaCteEmp!Fecha)
                    x.Tag = rsCtaCteEmp!Fecha
                    x.SubItems(1) = rsCtaCteEmp!NroComp
                    x.SubItems(2) = rsCtaCteEmp!TipoComp
                    Criterio = "CodComp = " & rsCtaCteEmp!TipoComp & ""
                    rsComprobantes.FindFirst (Criterio)
                    x.SubItems(3) = rsComprobantes!DescComp
                    x.SubItems(4) = rsCtaCteEmp!Debe
                    x.SubItems(5) = rsCtaCteEmp!SaldoComp
                End If
            ElseIf rsCtaCteEmp!TipoComp = 6 Then
                If rsCtaCteEmp!SaldoComp > 0 Then
                    Set x = Recibos.ListItems.Add(, , rsCtaCteEmp!Fecha)
                    x.Tag = rsCtaCteEmp!Fecha
                    x.SubItems(1) = rsCtaCteEmp!NroComp
                    x.SubItems(2) = rsCtaCteEmp!TipoComp
                    Criterio = "CodComp = " & rsCtaCteEmp!TipoComp & ""
                    rsComprobantes.FindFirst (Criterio)
                    x.SubItems(3) = rsComprobantes!DescComp
                    x.SubItems(4) = rsCtaCteEmp!Haber
                    x.SubItems(5) = rsCtaCteEmp!SaldoComp
                End If
            Else
                If rsCtaCteEmp!TipoComp = 2 Or rsCtaCteEmp!TipoComp = 14 Or rsCtaCteEmp!TipoComp = 17 Then
                    If rsCtaCteEmp!SaldoComp > 0 Then
                        Set x = NCPendientes.ListItems.Add(, , rsCtaCteEmp!Fecha)
                        x.Tag = rsCtaCteEmp!Fecha
                        x.SubItems(1) = rsCtaCteEmp!NroComp
                        x.SubItems(2) = rsCtaCteEmp!TipoComp
                        Criterio = "CodComp = " & rsCtaCteEmp!TipoComp & ""
                        rsComprobantes.FindFirst (Criterio)
                        x.SubItems(3) = rsComprobantes!DescComp
                        x.SubItems(4) = rsCtaCteEmp!Haber
                        x.SubItems(5) = rsCtaCteEmp!SaldoComp
                    End If
                End If
            End If
        rsCtaCteEmp.MoveNext
        Loop
    End If
    For i = i + 1 To Label2.Count
        Label2(i - 1).Caption = ""
    Next
    Text1(0) = ""
    Text1(1) = ""
    MsgBox "El Comprobante a sido aplicado correctamente"
Else
    MsgBox "El importe aplicar de la Factura no puede ser mayor al Recibo o NC"
End If
End Sub

Private Sub FactPendientes_Click()
Dim x As ListItem
Set x = FactPendientes.ListItems.Item(FactPendientes.SelectedItem.Index)
Label2(0) = x.Tag
Label2(1) = x.SubItems(1)
Label2(2) = x.SubItems(2)
Label2(3) = x.SubItems(3)
Label2(4) = x.SubItems(4)
Label2(5) = x.SubItems(5)
Text1(0) = x.SubItems(5)
End Sub

Private Sub Form_Initialize()
Set rsEmpresas = Nothing
Set rsCtaCteEmp = Nothing
Set rsComprobantes = Nothing
'Set rsAplicRec = Nothing
End Sub

Private Sub Form_Load()
Set rsEmpresas = db.OpenRecordset("Empresas", 2)
Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp", 2)
Set rsComprobantes = db.OpenRecordset("Comprobantes", 2)
 'Set rsAplicRec = db.OpenRecordset("AplicRecCob", 2)

End Sub

Private Sub NCPendientes_Click()
Dim x As ListItem
Set x = NCPendientes.ListItems.Item(NCPendientes.SelectedItem.Index)
Label2(6) = x.Tag
Label2(7) = x.SubItems(1)
Label2(8) = x.SubItems(2)
Label2(9) = x.SubItems(3)
Label2(10) = x.SubItems(4)
Label2(11) = x.SubItems(5)
Text1(1) = x.SubItems(5)
End Sub

Private Sub Recibos_Click()
Dim x As ListItem
Set x = Recibos.ListItems.Item(Recibos.SelectedItem.Index)
Label2(6) = x.Tag
Label2(7) = x.SubItems(1)
Label2(8) = x.SubItems(2)
Label2(9) = x.SubItems(3)
Label2(10) = x.SubItems(4)
Label2(11) = x.SubItems(5)
Text1(1) = x.SubItems(5)
End Sub

Private Sub Text1_LostFocus(Index As Integer)
If Index = 0 Then
    If Text1(0) > Val(Label2(5)) Then
        MsgBox "El importe a aplicar no puede ser mayor que el saldos del Comprobante"
        Text1(0).SetFocus
    End If
Else
    If Text1(1) > Val(Label2(11)) Then
        MsgBox "El importe a aplicar no puede ser mayor que el saldos del Comprobante"
        Text1(1).SetFocus
    End If
End If
End Sub
