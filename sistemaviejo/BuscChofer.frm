VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form BuscChofer 
   BackColor       =   &H80000007&
   Caption         =   "Buscar Chofer"
   ClientHeight    =   5505
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   6105
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   5505
   ScaleWidth      =   6105
   Begin VB.TextBox Viene 
      Height          =   285
      Left            =   120
      TabIndex        =   2
      Text            =   "Text2"
      Top             =   5160
      Visible         =   0   'False
      Width           =   615
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Left            =   960
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   4920
      Width           =   4815
   End
   Begin MSComctlLib.ListView ListChoferes 
      Height          =   4695
      Left            =   240
      TabIndex        =   0
      Top             =   120
      Width           =   5535
      _ExtentX        =   9763
      _ExtentY        =   8281
      View            =   3
      LabelWrap       =   0   'False
      HideSelection   =   0   'False
      FullRowSelect   =   -1  'True
      _Version        =   393217
      ForeColor       =   -2147483640
      BackColor       =   -2147483643
      BorderStyle     =   1
      Appearance      =   1
      NumItems        =   2
      BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         Text            =   "Cod Chofer"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   1
         Text            =   "Apellido y Nombre"
         Object.Width           =   7056
      EndProperty
   End
   Begin VB.Label Label8 
      BackColor       =   &H00000000&
      Caption         =   "Buscar"
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
      TabIndex        =   3
      Top             =   4920
      Width           =   855
   End
End
Attribute VB_Name = "BuscChofer"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Form_Initialize()
Set rsChoferes = Nothing
End Sub

Private Sub Form_Load()

If Viene = "Liq" Then
    VCodflet = Liquidaciones.Text1(0)
ElseIf Viene = "LiqProd" Then
    VCodflet = LiqProducto.Text1(0)
End If
Set rsChoferes = db.OpenRecordset("Select * from Choferes Where CodFlet = " & VCodflet & "")
ListChoferes.ListItems.Clear
Do While Not rsChoferes.EOF
    Set Lista = ListChoferes.ListItems.Add(, , rsChoferes!CodChoferes)
        Lista.Tag = rsChoferes!CodChoferes
        Lista.SubItems(1) = rsChoferes!AyN
    rsChoferes.MoveNext
Loop
Set rsChoferes = Nothing
Text1.Text = ""
End Sub

Private Sub ListChoferes_DblClick()
Dim VCodChofer As Long
If Viene = "Liq" Then
    Set Lista = ListChoferes.ListItems.Item(ListChoferes.SelectedItem.Index)
    VCodChofer = Lista.Tag
    Set rsChoferes = db.OpenRecordset("Select * from Choferes Where CodChoferes = " & VCodChofer & "", 2)
    If Not rsChoferes.EOF And Not rsChoferes.BOF Then
        Liquidaciones.Text1(17) = rsChoferes!CodChoferes
        Liquidaciones.Text1(18) = rsChoferes!AyN
    End If
    Set rsChoferes = Nothing
    Unload Me
    Liquidaciones.Text1(19).SetFocus
    Exit Sub
End If
If Viene = "LiqProd" Then
    Set Lista = ListChoferes.ListItems.Item(ListChoferes.SelectedItem.Index)
    VCodChofer = Lista.Tag
    Set rsChoferes = db.OpenRecordset("Select * from Choferes Where CodChoferes = " & VCodChofer & "", 2)
    If Not rsChoferes.EOF And Not rsChoferes.BOF Then
        LiqProducto.Text1(7) = rsChoferes!CodChoferes
        LiqProducto.Text1(8) = rsChoferes!AyN
    End If
    Set rsChoferes = Nothing
    Unload Me
    LiqProducto.Text1(9).SetFocus
    Exit Sub
End If

End Sub

Private Sub Text1_Change()

If Viene = "Liq" Then
    VCodflet = Liquidaciones.Text1(0)
ElseIf Viene = "LiqProd" Then
    VCodflet = LiqProducto.Text1(0)
End If
Set rsChoferes = db.OpenRecordset("SELECT * FROM Choferes WHERE CodFlet = " & VCodflet & " AND AyN LIKE '*" & Text1 & "*' ORDER BY AyN")
ListChoferes.ListItems.Clear
Do While Not rsChoferes.EOF
    Set Lista = ListChoferes.ListItems.Add(, , rsChoferes!CodChoferes)
        Lista.Tag = rsChoferes!CodChoferes
        Lista.SubItems(1) = rsChoferes!AyN
    rsChoferes.MoveNext
Loop
Set rsChoferes = Nothing

End Sub

