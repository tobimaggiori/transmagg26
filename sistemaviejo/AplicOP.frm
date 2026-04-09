VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form AplicOP 
   BackColor       =   &H80000007&
   Caption         =   "Aplicar Orden de Pago"
   ClientHeight    =   6960
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   10815
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   6960
   ScaleWidth      =   10815
   Begin VB.TextBox Text3 
      ForeColor       =   &H000000FF&
      Height          =   285
      Index           =   2
      Left            =   8880
      TabIndex        =   26
      Text            =   "Text3"
      Top             =   6360
      Width           =   975
   End
   Begin VB.CommandButton Grabar 
      Caption         =   "Aplicar Comprobantes"
      Height          =   375
      Left            =   4080
      TabIndex        =   25
      Top             =   6480
      Width           =   2535
   End
   Begin VB.TextBox Text3 
      Height          =   285
      Index           =   1
      Left            =   8880
      TabIndex        =   22
      Text            =   "Text3"
      Top             =   5880
      Width           =   975
   End
   Begin VB.TextBox Text3 
      Height          =   285
      Index           =   0
      Left            =   3480
      TabIndex        =   21
      Text            =   "Text3"
      Top             =   5880
      Width           =   975
   End
   Begin VB.CommandButton AplicarOP 
      Caption         =   "Aplicar"
      Height          =   255
      Left            =   9960
      TabIndex        =   20
      Top             =   3120
      Width           =   735
   End
   Begin VB.TextBox Text2 
      Height          =   285
      Index           =   7
      Left            =   8880
      TabIndex        =   19
      Text            =   "Text2"
      Top             =   3120
      Width           =   975
   End
   Begin VB.TextBox Text2 
      Height          =   285
      Index           =   6
      Left            =   7680
      TabIndex        =   18
      Text            =   "Text2"
      Top             =   3120
      Width           =   1095
   End
   Begin VB.TextBox Text2 
      Height          =   285
      Index           =   5
      Left            =   6840
      TabIndex        =   17
      Text            =   "Text2"
      Top             =   3120
      Width           =   735
   End
   Begin VB.TextBox Text2 
      Height          =   285
      Index           =   4
      Left            =   5640
      TabIndex        =   16
      Text            =   "Text2"
      Top             =   3120
      Width           =   1095
   End
   Begin VB.CommandButton AplicarFC 
      Caption         =   "Aplicar"
      Height          =   255
      Left            =   4560
      TabIndex        =   15
      Top             =   3120
      Width           =   735
   End
   Begin VB.TextBox Text2 
      Height          =   285
      Index           =   3
      Left            =   3480
      TabIndex        =   14
      Text            =   "Text2"
      Top             =   3120
      Width           =   975
   End
   Begin VB.TextBox Text2 
      Height          =   285
      Index           =   2
      Left            =   2280
      TabIndex        =   13
      Text            =   "Text2"
      Top             =   3120
      Width           =   1095
   End
   Begin VB.TextBox Text2 
      Height          =   285
      Index           =   1
      Left            =   1440
      TabIndex        =   12
      Text            =   "Text2"
      Top             =   3120
      Width           =   735
   End
   Begin VB.TextBox Text2 
      Height          =   285
      Index           =   0
      Left            =   240
      TabIndex        =   11
      Text            =   "Text2"
      Top             =   3120
      Width           =   1095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   2640
      TabIndex        =   3
      Text            =   "Text1"
      Top             =   240
      Width           =   4095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   1680
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   240
      Width           =   855
   End
   Begin MSComctlLib.ListView OrdenPago 
      Height          =   1815
      Left            =   5520
      TabIndex        =   1
      Top             =   1200
      Width           =   5100
      _ExtentX        =   8996
      _ExtentY        =   3201
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
      NumItems        =   4
      BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         Text            =   "Fecha"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   1
         Text            =   "PtoVta"
         Object.Width           =   882
      EndProperty
      BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   2
         Text            =   "Número"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   3
         Text            =   "Saldo"
         Object.Width           =   2540
      EndProperty
   End
   Begin MSComctlLib.ListView Facturas 
      Height          =   1815
      Left            =   240
      TabIndex        =   0
      Top             =   1200
      Width           =   5100
      _ExtentX        =   8996
      _ExtentY        =   3201
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
      NumItems        =   4
      BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         Text            =   "Fecha"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   1
         Text            =   "Pto Vta"
         Object.Width           =   882
      EndProperty
      BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   2
         Text            =   "Número"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   3
         Text            =   "Saldo"
         Object.Width           =   2540
      EndProperty
   End
   Begin MSComctlLib.ListView FactAplic 
      Height          =   1815
      Left            =   240
      TabIndex        =   7
      Top             =   3960
      Width           =   5100
      _ExtentX        =   8996
      _ExtentY        =   3201
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
      NumItems        =   4
      BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         Text            =   "Fecha"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   1
         Text            =   "Pto Vta"
         Object.Width           =   882
      EndProperty
      BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   2
         Text            =   "Número"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   3
         Text            =   "Saldo"
         Object.Width           =   2540
      EndProperty
   End
   Begin MSComctlLib.ListView OPAplicada 
      Height          =   1815
      Left            =   5640
      TabIndex        =   9
      Top             =   3960
      Width           =   5025
      _ExtentX        =   8864
      _ExtentY        =   3201
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
      NumItems        =   4
      BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         Text            =   "Fecha"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   1
         Text            =   "PtoVta"
         Object.Width           =   882
      EndProperty
      BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   2
         Text            =   "Número"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   3
         Text            =   "Saldo"
         Object.Width           =   2540
      EndProperty
   End
   Begin VB.Label Label8 
      BackColor       =   &H00000000&
      Caption         =   "DIFERENCIA"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H000000FF&
      Height          =   255
      Left            =   6960
      TabIndex        =   27
      Top             =   6360
      Width           =   3015
   End
   Begin VB.Label Label7 
      BackColor       =   &H00000000&
      Caption         =   "Total Orden de Pago Aplicada"
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
      Left            =   5640
      TabIndex        =   24
      Top             =   5880
      Width           =   3015
   End
   Begin VB.Label Label6 
      BackColor       =   &H00000000&
      Caption         =   "Total Facturas Aplicadas"
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
      Left            =   240
      TabIndex        =   23
      Top             =   5880
      Width           =   2415
   End
   Begin VB.Label Label5 
      BackColor       =   &H00000000&
      Caption         =   "Orden de Pago Aplicada"
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
      Left            =   5640
      TabIndex        =   10
      Top             =   3600
      Width           =   2415
   End
   Begin VB.Label Label4 
      BackColor       =   &H00000000&
      Caption         =   "Facturas Aplicadas"
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
      Left            =   240
      TabIndex        =   8
      Top             =   3600
      Width           =   2415
   End
   Begin VB.Label Label3 
      BackColor       =   &H00000000&
      Caption         =   "Orden de Pago"
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
      Left            =   5520
      TabIndex        =   6
      Top             =   840
      Width           =   1455
   End
   Begin VB.Label Label2 
      BackColor       =   &H00000000&
      Caption         =   "Facturas"
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
      Left            =   240
      TabIndex        =   5
      Top             =   840
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Proveedor"
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
      Left            =   120
      TabIndex        =   4
      Top             =   240
      Width           =   1455
   End
End
Attribute VB_Name = "AplicOP"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private LFact As ListItem, LOP As ListItem, TFactAplic  As Double, TOPAplic As Double

Private Sub AplicarFC_Click()
Set LFact = FactAplic.ListItems.Add(, , Text2(0))
    LFact.Tag = Text2(0)
    LFact.SubItems(1) = Text2(1)
    LFact.SubItems(2) = Text2(2)
    LFact.SubItems(3) = Text2(3)
    TFactAplic = TFactAplic + Text2(3)
    Text3(0) = FormatNumber(TFactAplic)
    Text3(2) = FormatNumber(TOPAplic - TFactAplic)
Text2(0) = "": Text2(1) = "": Text2(2) = "": Text2(3) = ""
End Sub

Private Sub AplicarOP_Click()
If OPAplicada.ListItems.Count >= 1 Then
    MsgBox "Debe aplicar de a una Orden de Pago"
Else
    Set LOP = OPAplicada.ListItems.Add(, , Text2(4))
        LOP.Tag = Text2(4)
        LOP.SubItems(1) = Text2(5)
        LOP.SubItems(2) = Text2(6)
        LOP.SubItems(3) = Text2(7)
        TOPAplic = TOPAplic + Text2(7)
        Text3(1) = FormatNumber(TOPAplic)
        Text3(2) = FormatNumber(TOPAplic - TFactAplic)
        Text2(4) = "": Text2(5) = "": Text2(6) = "": Text2(7) = ""
End If
End Sub

Private Sub Command1_Click()

End Sub

Private Sub FactAplic_DblClick()
Set LFact = FactAplic.ListItems.Item(FactAplic.SelectedItem.Index)
     Text2(0) = LFact.Tag
      Text2(1) = LFact.SubItems(1)
     Text2(2) = LFact.SubItems(2)
      Text2(3) = LFact.SubItems(3)
    TFactAplic = TFactAplic - LFact.SubItems(3)
    Text3(0) = FormatNumber(TFactAplic)
    Text3(2) = FormatNumber(TOPAplic - TFactAplic)
    FactAplic.ListItems.Remove (FactAplic.SelectedItem.Index)
End Sub

Private Sub Facturas_DblClick()
Set LFact = Facturas.ListItems.Item(Facturas.SelectedItem.Index)
    Text2(0) = LFact.Tag
    Text2(1) = LFact.SubItems(1)
    Text2(2) = LFact.SubItems(2)
    Text2(3) = LFact.SubItems(3)
    Facturas.ListItems.Remove (Facturas.SelectedItem.Index)
End Sub

Private Sub Form_Load()
i = 0
For i = i + 1 To Text1.Count
    Text1(i - 1) = ""
Next
i = 0
For i = i + 1 To Text2.Count
    Text2(i - 1) = ""
Next
Text3(0) = "0.00": Text3(1) = "0.00": Text3(2) = "0.00"
TFactAplic = 0: TOPAplic = 0
Facturas.ListItems.Clear
OrdenPago.ListItems.Clear
FactAplic.ListItems.Clear
OPAplicada.ListItems.Clear

End Sub

Private Sub Grabar_Click()
If FormatNumber(TFactAplic) = FormatNumber(TOPAplic) Then
    Set rsAplicOP = db.OpenRecordset("AplicOP")
    Set LOP = OPAplicada.ListItems.Item(1)
    Set rsCtaCteProv = db.OpenRecordset("SELECT * FROM CtaCteProv WHERE CodProv = " & Text1(0) & " AND NroComp = " & LOP.SubItems(2) & " AND TipoComp = 11")
    If rsCtaCteProv.EOF Then
         Set rsCtaCteProv = db.OpenRecordset("SELECT * FROM CtaCteProv WHERE CodProv = " & Text1(0) & " AND NroComp = " & LOP.SubItems(2) & " AND TipoComp = 3")
    End If
    
    rsCtaCteProv.Edit
    rsCtaCteProv.Fields("SaldoComp") = FormatNumber(rsCtaCteProv.Fields("SaldoComp") - Text3(1))
    rsCtaCteProv.Update
    i = 0
    For i = i + 1 To FactAplic.ListItems.Count
        Set LFact = FactAplic.ListItems.Item(i)
        'Set rsCtaCteProv = db.OpenRecordset("Select * from CtaCteProv Where CodProv = '" & Text1(0) & "' and NroComp = " & LFact.SubItems(2) & " and PtoVta = " & LFact.SubItems(1) & " and TipoComp = 1 OR TIPOcOMP = 60")
        Set rsCtaCteProv = db.OpenRecordset("Select * from CtaCteProv Where NroComp = " & LFact.SubItems(2) & " and PtoVta = " & LFact.SubItems(1) & " and CodProv = " & Text1(0) & "")
        If Not rsCtaCteProv.EOF Then
            rsCtaCteProv.Edit
            rsCtaCteProv.Fields("SaldoComp") = FormatNumber(rsCtaCteProv.Fields("SaldoComp") - LFact.SubItems(3))
            rsCtaCteProv.Update
            rsCtaCteProv.MoveNext
        Else
            Do While rsCtaCteProv.EOF
                If rsCtaCteProv!codprov = Text1(0) Then
                    rsCtaCteProv.Edit
                    rsCtaCteProv.Fields("SaldoComp") = FormatNumber(rsCtaCteProv.Fields("SaldoComp") - LFact.SubItems(3))
                    rsCtaCteProv.Update
                End If
                rsCtaCteProv.MoveNext
            Loop
        End If
                
        'actualiza saldo ACUENTA
        
        Set rsAplicOP = db.OpenRecordset("SELECT * FROM AplicOP WHERE NroFact = null And NroOP = " & LOP.SubItems(2) & "")
        If Not rsAplicOP.EOF Then
        rsAplicOP.Edit
        rsAplicOP.Fields("ImpAplic") = rsAplicOP.Fields("ImpAplic") - LFact.SubItems(3)
        rsAplicOP.Update
        'Aplica Orden de Pago
        rsAplicOP.AddNew
        rsAplicOP.Fields("NroOP") = LOP.SubItems(2)
        rsAplicOP.Fields("PtoVta") = 1
        rsAplicOP.Fields("NroFact") = LFact.SubItems(2)
        rsAplicOP.Fields("ImpAplic") = LFact.SubItems(3)
        rsAplicOP.Update
        End If
    Next
Else
    MsgBox "Debe Coincidir los totales aplicar"
End If
Form_Load
End Sub

Private Sub OPAplicada_DblClick()
Set LOP = OPAplicada.ListItems.Item(OPAplicada.SelectedItem.Index)
     Text2(4) = LOP.Tag
     Text2(5) = LOP.SubItems(1)
     Text2(6) = LOP.SubItems(2)
     Text2(7) = LOP.SubItems(3)
    TOPAplic = TOPAplic - LOP.SubItems(3)
    Text3(1) = FormatNumber(TOPAplic)
    Text3(2) = FormatNumber(TOPAplic - TFactAplic)
    OPAplicada.ListItems.Remove (OPAplicada.SelectedItem.Index)

End Sub

Private Sub OrdenPago_DblClick()
Set LOP = OrdenPago.ListItems.Item(OrdenPago.SelectedItem.Index)
    Text2(4) = LOP.Tag
    Text2(5) = LOP.SubItems(1)
    Text2(6) = LOP.SubItems(2)
    Text2(7) = LOP.SubItems(3)
    OrdenPago.ListItems.Remove (OrdenPago.SelectedItem.Index)
End Sub

Private Sub Text1_LostFocus(Index As Integer)
Select Case Index
Case 0:
    If Not Text1(0) = "" Then
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & Text1(0) & "")
        If Not rsFleteros.EOF And Not rsFleteros.BOF Then
            Text1(1) = rsFleteros!DescFlet
        Else
            MsgBox "El Fleteros no existe", vbInformation
            Exit Sub
        End If
        Set rsCtaCteProv = db.OpenRecordset("Select * From CtaCteProv Where SaldoComp > 0 AND CodProv = " & Text1(0) & " order by Fecha")
        With rsCtaCteProv
        Do While Not rsCtaCteProv.EOF
            If .Fields("TipoComp") = 1 Or .Fields("TipoComp") = 60 Then
                Set LFact = Facturas.ListItems.Add(, , .Fields("Fecha"))
                LFact.Tag = .Fields("Fecha")
                LFact.SubItems(1) = .Fields("PtoVta")
                LFact.SubItems(2) = .Fields("NroComp")
                LFact.SubItems(3) = .Fields("SaldoComp")
            ElseIf .Fields("TipoComp") = 11 Or .Fields("TipoComp") = 3 Or .Fields("TipoComp") = 18 Then
                Set LOP = OrdenPago.ListItems.Add(, , .Fields("Fecha"))
                LOP.Tag = .Fields("Fecha")
                LOP.SubItems(1) = .Fields("PtoVta")
                LOP.SubItems(2) = .Fields("NroComp")
                LOP.SubItems(3) = .Fields("SaldoComp")
            End If
            .MoveNext
        Loop
        End With
    End If
End Select
End Sub
