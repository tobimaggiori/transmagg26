VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form AcreditaCH 
   BackColor       =   &H80000007&
   Caption         =   "Acreditación de Cheques"
   ClientHeight    =   8040
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   7935
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   8040
   ScaleWidth      =   7935
   Begin VB.TextBox Text4 
      Height          =   285
      Index           =   1
      Left            =   2520
      TabIndex        =   1
      Text            =   "Text4"
      Top             =   240
      Width           =   4095
   End
   Begin VB.TextBox Text4 
      Height          =   285
      Index           =   0
      Left            =   1560
      TabIndex        =   0
      Text            =   "Text4"
      Top             =   240
      Width           =   855
   End
   Begin VB.CommandButton Command2 
      Caption         =   "Acreditar"
      Height          =   375
      Left            =   1080
      TabIndex        =   15
      Top             =   7080
      Width           =   4575
   End
   Begin VB.CommandButton Command1 
      BackColor       =   &H80000012&
      Caption         =   "Cargar"
      Height          =   255
      Left            =   6840
      MaskColor       =   &H00808080&
      TabIndex        =   14
      Top             =   3360
      Width           =   975
   End
   Begin VB.Frame Frame2 
      BackColor       =   &H80000007&
      Caption         =   "Cheques pendientes de Acreditar"
      ForeColor       =   &H0080C0FF&
      Height          =   3015
      Left            =   360
      TabIndex        =   10
      Top             =   3840
      Width           =   6615
      Begin VB.TextBox Text3 
         Height          =   285
         Left            =   4920
         TabIndex        =   11
         Text            =   "Text1"
         Top             =   2520
         Width           =   1335
      End
      Begin MSComctlLib.ListView ChAAcred 
         Height          =   1935
         Left            =   240
         TabIndex        =   12
         Top             =   360
         Width           =   6100
         _ExtentX        =   10769
         _ExtentY        =   3413
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
         NumItems        =   5
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "CtaCte"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "NroChe"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Importe"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Object.Width           =   2540
         EndProperty
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Total Cheques Emitidos"
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
         Left            =   240
         TabIndex        =   13
         Top             =   2520
         Width           =   4455
      End
   End
   Begin VB.TextBox Text2 
      Height          =   285
      Index           =   3
      Left            =   5280
      TabIndex        =   7
      Text            =   "Text2"
      Top             =   3360
      Width           =   1440
   End
   Begin VB.TextBox Text2 
      Height          =   285
      Index           =   2
      Left            =   3720
      TabIndex        =   6
      Text            =   "Text2"
      Top             =   3360
      Width           =   1440
   End
   Begin VB.TextBox Text2 
      Height          =   285
      Index           =   1
      Left            =   2160
      TabIndex        =   5
      Text            =   "Text2"
      Top             =   3360
      Width           =   1440
   End
   Begin VB.TextBox Text2 
      Height          =   285
      Index           =   0
      Left            =   600
      TabIndex        =   4
      Text            =   "Text2"
      Top             =   3360
      Width           =   1440
   End
   Begin VB.Frame Frame1 
      BackColor       =   &H80000007&
      Caption         =   "Cheques pendientes de Acreditar"
      ForeColor       =   &H0080C0FF&
      Height          =   2655
      Left            =   360
      TabIndex        =   2
      Top             =   600
      Width           =   6615
      Begin VB.TextBox Text1 
         Height          =   285
         Left            =   4920
         TabIndex        =   8
         Text            =   "Text1"
         Top             =   2160
         Width           =   1335
      End
      Begin MSComctlLib.ListView ChSinAcred 
         Height          =   1695
         Left            =   240
         TabIndex        =   3
         Top             =   360
         Width           =   6105
         _ExtentX        =   10769
         _ExtentY        =   2990
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
         NumItems        =   5
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "CtaCte"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "NroChe"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Importe"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Object.Width           =   2540
         EndProperty
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Total Cheques Emitidos"
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
         Index           =   21
         Left            =   240
         TabIndex        =   9
         Top             =   2160
         Width           =   4455
      End
   End
   Begin VB.Label Label1 
      BackColor       =   &H80000007&
      Caption         =   "Cta Cte:"
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Left            =   360
      TabIndex        =   16
      Top             =   240
      Width           =   1095
   End
End
Attribute VB_Name = "AcreditaCH"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Dim TCHEmitidos As Double, TCHACred As Double
Public LCHSinAcred As ListItem
Public LCHAAcred As ListItem
Private Sub ChSinAcred_DblClick()
Set LCHSinAcred = ChSinAcred.ListItems.Item(ChSinAcred.SelectedItem.Index)
If Not LCHSinAcred.Tag = "" Then
    Text2(0) = LCHSinAcred.Tag
    Text2(1) = LCHSinAcred.SubItems(1)
    Text2(2) = LCHSinAcred.SubItems(2)
    Text2(3) = LCHSinAcred.SubItems(3)
    TCHEmitidos = TCHEmitidos - LCHSinAcred.SubItems(3)
    ChSinAcred.ListItems.Remove (ChSinAcred.SelectedItem.Index)
End If
End Sub

Private Sub Command1_Click()
If Not Text2(0) = "" Then
    Set LCHAAcred = ChAAcred.ListItems.Add(, , Text2(0))
        LCHAAcred.Tag = Text2(0)
        LCHAAcred.SubItems(1) = Text2(1)
        LCHAAcred.SubItems(2) = Text2(2)
        LCHAAcred.SubItems(3) = FormatNumber(Text2(3))
        TCHACred = TCHACred + Text2(3)
        Text3 = FormatNumber(TCHACred)
        Text2(0) = "": Text2(1) = "": Text2(2) = "": Text2(3) = ""
End If
End Sub

Private Sub Command2_Click()
i = 0
Set rsCtaCteBco = db.OpenRecordset("CtaCteBco")
For i = i + 1 To ChAAcred.ListItems.Count
    Set LCHAAcred = ChAAcred.ListItems.Item(i)
    With rsCtaCteBco
        .AddNew
        .Fields("Fecha") = LCHAAcred.Tag
        .Fields("CtaCte") = LCHAAcred.SubItems(1)
        .Fields("CodComp") = 1
        .Fields("NroMov") = LCHAAcred.SubItems(2)
        .Fields("Haber") = LCHAAcred.SubItems(3)
        .Fields("Conciliado") = False
        .Update
    End With
    Set rsCHEmitidos = db.OpenRecordset("Select * From ChEmitidos Where NroComp =" & LCHAAcred.SubItems(2) & "")
    rsCHEmitidos.Edit
    rsCHEmitidos.Fields("Estado") = "Acreditado"
    rsCHEmitidos.Fields("FAcred") = LCHAAcred.Tag
    rsCHEmitidos.Update
Next
MsgBox "Cheques Acreditados"
TCHEmitidos = 0: TCHACred = 0
Text2(0) = "": Text2(1) = "": Text2(2) = "": Text2(3) = "": Text3 = "0.00"
Text4(0) = "": Text4(1) = "": Text1 = ""
ChSinAcred.ListItems.Clear
ChAAcred.ListItems.Clear
Text4(0).SetFocus
End Sub

Private Sub Form_Load()
TCHEmitidos = 0: TCHACred = 0
Text2(0) = "": Text2(1) = "": Text2(2) = "": Text2(3) = "": Text3 = "0.00": Text1 = "0.00"
Text4(0) = "": Text4(1) = ""
ChSinAcred.ListItems.Clear
End Sub

Private Sub Text4_LostFocus(Index As Integer)
If Not Text4(0) = "" Then
    Set rsCtaBcoPropias = db.OpenRecordset("Select * from CtaCtePropias Where CtaCte = '" & Text4(0) & "'")
    If Not rsCtaBcoPropias.EOF And Not rsCtaBcoPropias.BOF Then
        Text4(1) = rsCtaBcoPropias!DescBco
    Else
        MsgBox "La Cuenta no existe", vbInformation
        Text4(0).Text = ""
        Text4(0).SetFocus
        Exit Sub
    End If
    Set rsCtaBcoPropias = Nothing
    Set rsCHEmitidos = db.OpenRecordset("SELECT * FROM ChEmitidos Where Estado = 'Pendiente' Order By Fecha")
    ChSinAcred.ListItems.Clear: ChAAcred.ListItems.Clear
    TCHEmitidos = 0
    Do While Not rsCHEmitidos.EOF
        If Text4(0) = rsCHEmitidos!CtaCte Then
        Set LCHSinAcred = ChSinAcred.ListItems.Add(, , rsCHEmitidos!Fecha)
            LCHSinAcred.Tag = rsCHEmitidos!Fecha
            LCHSinAcred.SubItems(1) = rsCHEmitidos!CtaCte
            LCHSinAcred.SubItems(2) = rsCHEmitidos!NroComp
            LCHSinAcred.SubItems(3) = FormatNumber(rsCHEmitidos!Haber)
            TCHEmitidos = TCHEmitidos + FormatNumber(rsCHEmitidos!Haber)
        End If
            rsCHEmitidos.MoveNext
    Loop
    Text1 = FormatNumber(TCHEmitidos)
    ChSinAcred.SetFocus
Else
    MsgBox "Debe completar el Nro de Cta Cte"
End If


End Sub
